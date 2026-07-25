import { useState, useMemo, useCallback } from "react";
import { Track } from "@/types/track";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useVideoGenerationStatus } from "@/hooks/useVideoGenerationStatus";
import { useTrackActions } from "@/hooks/useTrackActions";
import { useAudioUpscale } from "@/hooks/useAudioUpscale";
import { useTrackStems } from "@/hooks/useTrackStems";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { ActionId } from "@/config/trackActionsConfig";
import { TrackActionState, isActionAvailable, isActionDisabled } from "@/lib/trackActionConditions";

interface UseTrackActionsStateProps {
  track: Track;
  onDelete?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  /**
   * Gate the initial fetch of stems / versions until the consumer actually
   * needs the data (e.g. menu or sheet is opened). Defaults to `true` for
   * backwards compatibility, but callers rendering the menu/sheet on every
   * track card should pass `false` until user interaction to avoid N+1
   * network storms on library load.
   */
  enabled?: boolean;
}

interface DialogStates {
  details: boolean;
  extend: boolean;
  cover: boolean;
  addToProject: boolean;
  share: boolean;
  addToPlaylist: boolean;
  deleteConfirm: boolean;
  deleteVersionSelect: boolean;
  rename: boolean;
  createArtist: boolean;
  addVocals: boolean;
  addInstrumental: boolean;
  mashup: boolean;
  remix: boolean;
}

export function useTrackActionsState({
  track,
  onDelete,
  onDownload,
  onClose,
  enabled = true,
}: UseTrackActionsStateProps) {
  const navigate = useNavigate();

  // Cached queries — deduped across menu/sheet, cached across re-opens.
  const stemsQuery = useTrackStems(enabled && track?.id ? track.id : "");
  const versionsQuery = useTrackVersions(enabled && track?.id ? track.id : undefined);

  const stems = useMemo(
    () => (stemsQuery.data || []).map((s) => ({ id: s.id, stem_type: s.stem_type, audio_url: s.audio_url })),
    [stemsQuery.data],
  );
  const stemCount = stems.length;
  const versions = versionsQuery.data || [];
  const versionCount = versions.length;

  const activeVersion = useMemo(() => {
    if (!versions.length) return null;
    const sorted = [...versions].sort((a, b) => (a.clip_index ?? 0) - (b.clip_index ?? 0));
    const active = track?.active_version_id
      ? sorted.find((v) => v.id === track.active_version_id) || sorted[0]
      : sorted[0];
    const meta = (active.metadata ?? {}) as { suno_id?: string };
    return {
      versionLabel: active.version_label || "A",
      audioUrl: active.audio_url || track?.audio_url || "",
      sunoId: meta.suno_id || track?.suno_id || undefined,
    };
  }, [versions, track?.active_version_id, track?.audio_url, track?.suno_id]);

  const [dialogs, setDialogs] = useState<DialogStates>({
    details: false,
    extend: false,
    cover: false,
    addToProject: false,
    share: false,
    addToPlaylist: false,
    deleteConfirm: false,
    deleteVersionSelect: false,
    rename: false,
    createArtist: false,
    addVocals: false,
    addInstrumental: false,
    mashup: false,
    remix: false,
  });

  // Hooks - lazy load video status only when needed
  const [shouldFetchVideoStatus, setShouldFetchVideoStatus] = useState(false);
  const videoStatus = useVideoGenerationStatus(shouldFetchVideoStatus ? track?.id : undefined);
  const { isGenerating: isVideoGenerating, hasVideo } = videoStatus;
  const {
    isProcessing,
    handleShare,
    handleSeparateVocals,
    handleTogglePublic,
    handleConvertToWav,
    handleGenerateCover,
    handleGenerateVideo,
    handleSendToTelegram,
  } = useTrackActions();
  const { upscale: upscaleAudio, isLoading: isUpscaling } = useAudioUpscale();
  const { addToQueue, queue } = usePlayerStore();

  const isLoadingActions = stemsQuery.isLoading || versionsQuery.isLoading;

  // Check for specific stem types
  const hasVocalStem = stems.some((s) => s.stem_type === "vocal" || s.stem_type === "vocals");
  const hasInstrumentalStem = stems.some((s) => s.stem_type === "instrumental");

  // Check if track is instrumental:
  // 1. Explicit is_instrumental flag from database
  // 2. has_vocals is explicitly false
  // 3. Style contains "instrumental"
  // 4. Has instrumental stem but no vocal stem
  const isInstrumentalTrack = !!(
    track.is_instrumental === true ||
    track.has_vocals === false ||
    track.style?.toLowerCase().includes("instrumental") ||
    (hasInstrumentalStem && !hasVocalStem)
  );

  // Action state for condition checks
  const actionState: TrackActionState = {
    stemCount,
    versionCount,
    hasVideo,
    isVideoGenerating,
    hasVocalStem,
    hasInstrumentalStem,
    isInstrumentalTrack,
  };

  // Dialog helpers
  const openDialog = useCallback(
    (key: keyof DialogStates) => {
      setDialogs((prev) => ({ ...prev, [key]: true }));
      onClose?.();
    },
    [onClose],
  );

  const closeDialog = useCallback((key: keyof DialogStates) => {
    setDialogs((prev) => ({ ...prev, [key]: false }));
  }, []);

  // Action handlers
  const executeAction = useCallback(
    async (actionId: ActionId) => {
      if (!track) return;

      // Check if action is available
      if (!isActionAvailable(actionId, track, actionState)) {
        toast.error("Действие недоступно");
        return;
      }

      // Check if action is disabled
      if (isActionDisabled(actionId, track, actionState, isProcessing)) {
        return;
      }

      triggerHapticFeedback("light");

      switch (actionId) {
        // Info actions
        case "details":
          openDialog("details");
          break;
        case "toggle_public":
          await handleTogglePublic(track);
          onClose?.();
          break;
        case "rename":
          openDialog("rename");
          break;

        // Download actions
        case "download_mp3":
          onDownload?.();
          onClose?.();
          break;
        case "download_wav":
          await handleConvertToWav(track);
          onClose?.();
          break;
        case "download_stems":
          // Navigate to studio for stem download
          navigate(`/studio-v2/track/${track.id}`);
          onClose?.();
          break;

        // Share actions
        case "generate_video":
          await handleGenerateVideo(track);
          onClose?.();
          break;
        case "send_telegram":
          await handleSendToTelegram(track);
          onClose?.();
          break;
        case "copy_link":
          await handleShare(track);
          onClose?.();
          break;
        case "add_to_playlist":
          openDialog("addToPlaylist");
          break;
        case "add_to_project":
          openDialog("addToProject");
          break;

        // Studio actions
        case "open_studio":
          navigate(`/studio-v2/track/${track.id}`);
          onClose?.();
          break;
        case "replace_section":
          navigate(`/studio-v2/track/${track.id}?mode=replace`);
          onClose?.();
          break;
        case "stems_simple":
          await handleSeparateVocals(track, "simple", activeVersion?.sunoId);
          // Автоматически открыть студию после запуска разделения
          navigate(`/studio-v2/track/${track.id}?stems=pending`);
          onClose?.();
          break;
        case "stems_detailed":
          await handleSeparateVocals(track, "detailed", activeVersion?.sunoId);
          // Автоматически открыть студию после запуска разделения
          navigate(`/studio-v2/track/${track.id}?stems=pending`);
          onClose?.();
          break;
        case "transcribe_midi":
          navigate(`/studio-v2/track/${track.id}?mode=midi`);
          onClose?.();
          break;
        case "transcribe_notes":
          navigate(`/studio-v2/track/${track.id}?mode=notes`);
          onClose?.();
          break;

        // Create actions
        case "generate_cover":
          await handleGenerateCover(track);
          onClose?.();
          break;
        case "cover":
          openDialog("cover");
          break;
        case "extend":
          openDialog("extend");
          break;
        case "remix":
          // Открываем форму с параметрами активной версии вместо мгновенного запуска
          openDialog("remix");
          break;
        case "generate_similar":
          // Store track data in sessionStorage and navigate to generation
          sessionStorage.setItem(
            "similarTrackParams",
            JSON.stringify({
              style: track.style,
              prompt: track.prompt,
              tags: track.tags,
              title: track.title,
            }),
          );
          navigate("/?open=generate");
          onClose?.();
          break;
        case "create_artist_persona":
          openDialog("createArtist");
          break;
        case "add_vocals":
          openDialog("addVocals");
          break;
        case "add_instrumental":
          openDialog("addInstrumental");
          break;
        case "mashup":
          // Mashup needs at least one ready source track with audio_url.
          if (!track.audio_url) {
            toast.error("Mashup недоступен — у трека нет готового аудио");
            return;
          }
          openDialog("mashup");
          break;

        // Quality actions
        case "upscale_hd": {
          const upscaleUrl = activeVersion?.audioUrl || track.audio_url;
          if (upscaleUrl) {
            await upscaleAudio({ audioUrl: upscaleUrl, trackId: track.id });
          }
        }
          onClose?.();
          break;

        // Delete actions
        case "delete_version":
          openDialog("deleteVersionSelect");
          break;
        case "delete_all":
          openDialog("deleteConfirm");
          break;
      }
    },
    [
      track,
      actionState,
      isProcessing,
      navigate,
      onClose,
      onDownload,
      openDialog,
      handleSendToTelegram,
      handleSeparateVocals,
      handleGenerateCover,
      handleConvertToWav,
      handleGenerateVideo,
      activeVersion,
      handleTogglePublic,
      handleShare,
      upscaleAudio,
    ],
  );

  const handleConfirmDelete = useCallback(() => {
    triggerHapticFeedback("success");
    onDelete?.();
    closeDialog("deleteConfirm");
  }, [onDelete, closeDialog]);

  return {
    // State
    stemCount,
    versionCount,
    activeVersion,
    actionState,
    isProcessing,
    isLoadingActions,
    stems,

    // Dialogs
    dialogs,
    openDialog,
    closeDialog,

    // Actions
    executeAction,
    handleConfirmDelete,

    // Video status loader
    enableVideoStatusFetch: () => setShouldFetchVideoStatus(true),

    // Helpers
    isActionAvailable: (actionId: ActionId) => isActionAvailable(actionId, track, actionState),
    isActionDisabled: (actionId: ActionId) => isActionDisabled(actionId, track, actionState, isProcessing),
  };
}
