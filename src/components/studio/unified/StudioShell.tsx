/**
 * StudioShell — orchestrator for the Unified Studio.
 * Wires extracted hooks together; all logic lives in StudioShell/ subdirectory.
 *
 * Hooks:
 * - useStudioShellState   — all dialog / selection state
 * - useStudioStemSync     — DB stem import + realtime subscription
 * - useStudioKeyboardShortcuts — keyboard shortcuts
 * - useStudioCallbacks    — save / back / seek / play / stem-separation callbacks
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useUnifiedStudioStore } from "@/stores/useUnifiedStudioStore";
import { useViewStore } from "@/stores/studio";
import { StudioShellHeader } from "./StudioShellHeader";
import { StudioShellDialogs } from "./StudioShellDialogs";
import { StudioShellContent } from "./StudioShell/StudioShellContent";
import { useStudioShellState } from "./StudioShell/useStudioShellState";
import { useStudioKeyboardShortcuts } from "./StudioShell/useStudioKeyboardShortcuts";
import { useStudioCallbacks } from "./StudioShell/useStudioCallbacks";
import { useStudioAudioEngine, AudioTrack } from "@/hooks/studio/useStudioAudioEngine";
import { useMobileAudioFallback } from "@/hooks/studio/useMobileAudioFallback";
import { useStudioOptimizations } from "@/hooks/studio/useStudioOptimizations";
import { useAutoSave } from "@/hooks/studio/useAutoSave";
import { registerStudioAudio, unregisterStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useSectionDetection } from "@/hooks/useSectionDetection";
import { normalizeSunoLyrics } from "@/lib/lyrics/normalizeSunoLyrics";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useReplacedSections } from "@/hooks/useReplacedSections";
import { useSectionEditorStore } from "@/stores/useSectionEditorStore";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { useProjectTrackSync } from "@/hooks/studio/useProjectTrackSync";
import { useStudioOperationLock } from "@/hooks/studio/useStudioOperationLock";
import { useSourceTrack } from "@/hooks/studio/useSourceTrack";
import { useStudioRealtime } from "@/hooks/studio/useStudioRealtime";
import { useStemRealtime } from "@/hooks/useStemRealtime";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { OptimizedTransport } from "./OptimizedTransport";
import { MobileStudioPlayerBar } from "./MobileStudioPlayerBar";
import { StemSeparationProgress } from "@/components/stem-studio/StemSeparationProgress";
import { cn } from "@/lib/utils";
import { Loader2, Volume2, VolumeX, Upload, Plus } from "@/lib/icons";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logger } from "@/lib/logger";
import type { TrackStem } from "@/hooks/useTrackStems";

interface StudioShellProps {
  className?: string;
}

export const StudioShell = memo(function StudioShell({ className }: StudioShellProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pauseTrack: pauseGlobalPlayer } = usePlayerStore();

  const {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    isPlaying,
    currentTime,
    viewMode,
    setViewMode,
    canUndo,
    canRedo,
    undo,
    redo,
    resolvePendingTrack,
    setTrackActiveVersion,
    loadProject,
    play,
    pause,
    seek,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    setMasterVolume,
    reorderTracks,
  } = useUnifiedStudioStore();

  // ── All dialog / selection state ──────────────────────────────────────
  const dialogs = useStudioShellState();
  const { selectedSectionIndex, selectSection, setCustomRange } = useSectionEditorStore();

  // Remember previous master volume before muting (F6 fix)
  const [previousMasterVolume, setPreviousMasterVolume] = useState(0.85);

  // True when the studio was opened solely to replace a section (?mode=replace):
  // the workspace behind the panel is hidden and closing returns to the caller.
  const [replaceOnlyMode, setReplaceOnlyMode] = useState(false);

  const sourceTrackId = project?.sourceTrackId;
  const mainTrack = project?.tracks[0];
  const mainAudioUrl =
    mainTrack?.audioUrl ||
    mainTrack?.clips?.[0]?.audioUrl ||
    mainTrack?.versions?.find((v) => v.label === mainTrack.activeVersionLabel)?.audioUrl ||
    mainTrack?.versions?.[0]?.audioUrl;

  // ── Audio track conversion ────────────────────────────────────────────
  const audioTracks = useMemo((): AudioTrack[] => {
    const tracks = project?.tracks;
    if (!tracks) return [];
    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const readyTracks = tracks.filter((t) => t.status !== "pending" && t.status !== "failed");
    const stems = readyTracks.filter((t) => stemTypes.includes(t.type));
    const tracksToUse = stems.length > 0 ? stems : readyTracks;
    return tracksToUse.map((track) => {
      let audioUrl = track.audioUrl;
      if (!audioUrl && track.versions?.length) {
        const activeVersion = track.versions.find((v) => v.label === track.activeVersionLabel);
        audioUrl = activeVersion?.audioUrl || track.versions[0]?.audioUrl;
      }
      if (!audioUrl && track.clips?.[0]?.audioUrl) audioUrl = track.clips[0].audioUrl;
      return { id: track.id, audioUrl, volume: track.volume, muted: track.muted, solo: track.solo };
    });
  }, [project?.tracks]);

  const tracksAsStems = useMemo((): TrackStem[] => {
    const tracks = project?.tracks;
    const projectId = project?.id;
    if (!tracks || !projectId) return [];
    return tracks
      .filter((t) => t.status !== "pending" && t.status !== "failed")
      .map((track) => ({
        id: track.id,
        track_id: projectId,
        stem_type: track.type,
        audio_url: track.audioUrl || "",
        separation_mode: null,
        version_id: null,
        created_at: new Date().toISOString(),
      }));
  }, [project?.tracks, project?.id]);

  // ── Audio setup ───────────────────────────────────────────────────────
  const { activeStems, limitedStems, showFallbackWarning, dismissWarning } = useMobileAudioFallback({
    stems: tracksAsStems,
    enabled: isMobile,
  });

  const autoSave = useAutoSave({
    enabled: !!project,
    debounceMs: 30000,
    onSaveComplete: (success) => {
      if (success) logger.info("Auto-save completed");
    },
  });

  const studioOptimizations = useStudioOptimizations({
    stems: tracksAsStems,
    audioRefs: {},
    onTimeUpdate: seek,
    onStemVolumeChange: (id, v) => setTrackVolume(id, v),
    onMasterVolumeChange: setMasterVolume,
    onSeek: seek,
  });

  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks,
    masterVolume: project?.masterVolume ?? 0.85,
    onTimeUpdate: seek,
    onDurationChange: undefined,
    onEnded: () => {
      pause();
      seek(0);
    },
  });

  const duration = audioEngine.duration || project?.durationSeconds || 180;

  // ── Callbacks (save, back, seek, play/pause, stem-separation) ─────────
  const { handleSave, handleBack, handleAddTrack, handleSeek, handlePlayPause, handleStemSeparation, isSeparating, clearSeparatingState } =
    useStudioCallbacks({
      project,
      hasUnsavedChanges,
      sourceTrackId,
      audioEngine: {
        isPlaying: audioEngine.isPlaying,
        play: audioEngine.play,
        pause: audioEngine.pause,
        seek: audioEngine.seek,
      },
      pauseGlobalPlayer,
    });

  // ── Stem DB sync + realtime (single source: useStemRealtime) ──────────
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const stemRealtime = useStemRealtime(sourceTrackId ?? null);

  // Clear separating state when realtime reports completion/failure
  useEffect(() => {
    if (stemRealtime.isCompleted || stemRealtime.isFailed) {
      clearSeparatingState();
    }
  }, [stemRealtime.isCompleted, stemRealtime.isFailed, clearSeparatingState]);

  // ── Source track (via API layer) ──────────────────────────────────────
  const { data: sourceTrack } = useSourceTrack(sourceTrackId ?? null);

  // ── Lyrics + section detection ────────────────────────────────────────
  const { data: lyricsData } = useTimestampedLyrics(sourceTrack?.suno_task_id || null, sourceTrack?.suno_id || null);
  // Suno-tag normalization must happen before detection: markdown-wrapped tags
  // (**[Verse]**) otherwise leak into section labels and section lyrics.
  const normalizedTrackLyrics = useMemo(() => normalizeSunoLyrics(sourceTrack?.lyrics ?? null), [sourceTrack?.lyrics]);
  const detectedSections = useSectionDetection(normalizedTrackLyrics, lyricsData?.alignedWords, duration);
  const { data: replacedSectionsData } = useReplacedSections(sourceTrackId || "");
  const replacedRanges = useMemo(
    () => (replacedSectionsData || []).map((s) => ({ start: s.start, end: s.end })),
    [replacedSectionsData],
  );

  // ── Studio operations ─────────────────────────────────────────────────
  const operationLock = useStudioOperationLock(project);
  useProjectTrackSync(project?.id || null, sourceTrackId);
  const hasStems = operationLock.hasStems;

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useStudioKeyboardShortcuts({
    isPlaying,
    currentTime,
    duration,
    tracks: project?.tracks ?? [],
    onPlayPause: handlePlayPause,
    onSeek: handleSeek,
    onUndo: undo,
    onRedo: redo,
    onToggleMute: toggleTrackMute,
    onToggleSolo: toggleTrackSolo,
    onVersionChange: setTrackActiveVersion,
  });

  useTelegramBackButton({ visible: !!project, onClick: handleBack, fallbackPath: "/studio-v2" });

  // ── Playback ↔ engine sync ────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && !audioEngine.isPlaying) audioEngine.play();
    else if (!isPlaying && audioEngine.isPlaying) audioEngine.pause();
  }, [isPlaying, audioEngine]);

  useEffect(() => {
    registerStudioAudio("studio-shell", () => {
      audioEngine.pause();
      pause();
    });
    return () => unregisterStudioAudio("studio-shell");
  }, [audioEngine, pause]);

  // Sync track volumes + mute/solo to audio engine
  useEffect(() => {
    const tracks = project?.tracks ?? [];
    const hasAnySolo = tracks.some((t) => t.solo);
    tracks.forEach((track) => {
      const effectiveVolume = track.muted ? 0 : hasAnySolo && !track.solo ? 0 : track.volume;
      audioEngine.setTrackVolume(track.id, effectiveVolume);
    });
  }, [project?.tracks, audioEngine]);

  // ── Generation tasks realtime subscription (via api layer) ───────────
  const pendingTrackIds = useMemo(
    () => new Set((project?.tracks ?? []).filter((t) => t.status === "pending").map((t) => t.id)),
    [project?.tracks],
  );
  const pendingTasks = useMemo(
    () =>
      (project?.tracks ?? [])
        .filter((t) => t.status === "pending" && t.taskId)
        .map((t) => ({ trackId: t.id, taskId: t.taskId! })),
    [project?.tracks],
  );

  useStudioRealtime({
    projectId: project?.id ?? null,
    pendingTasks,
    pendingTrackIds,
    isMountedRef,
    callbacks: {
      onTaskCompleted: ({ taskId, versions }) => {
        const context = dialogs.pendingGenerationContextRef.current.get(taskId);
        if (context?.type === "replace_instrumental") {
          resolvePendingTrack(taskId, versions);
          const ctxTrackId = pendingTasks.find((p) => p.taskId === taskId)?.trackId;
          dialogs.setInstrumentalResultData({
            newTrackId: ctxTrackId ?? "",
            existingInstrumentalId: context.existingId,
            versions,
            trackName: "Новый инструментал",
          });
          dialogs.setShowInstrumentalResult(true);
          dialogs.pendingGenerationContextRef.current.delete(taskId);
        } else {
          resolvePendingTrack(taskId, versions);
          toast.success("Инструментал готов! 🎸", {
            description: versions.length > 1 ? "Выберите версию A или B" : "Трек добавлен",
          });
        }
      },
      onTaskFailed: () => {
        toast.error("Ошибка генерации инструментала");
      },
      onProjectTracksUpdated: (newTracks) => {
        const resolvedTracks = newTracks.filter((t) => t.status === "ready" && pendingTrackIds.has(t.id));
        if (resolvedTracks.length > 0 && project?.id) void loadProject(project.id);
      },
    },
    loadProject: loadProject as unknown as (id: string) => Promise<void>,
  });

  const openSectionEditorForTrack = useCallback(
    (track: NonNullable<typeof project>["tracks"][number]) => {
      const sectionIndex = detectedSections.findIndex(
        (section) => currentTime >= section.startTime && currentTime <= section.endTime,
      );
      const resolvedIndex = sectionIndex >= 0 ? sectionIndex : 0;
      const section = detectedSections[resolvedIndex];

      if (section) {
        selectSection(section, resolvedIndex);
      } else if (duration > 0) {
        const fallbackEnd = Math.max(5, Math.min(duration * 0.25, duration * 0.5, 30));
        setCustomRange(0, fallbackEnd);
      }

      dialogs.setSelectedSectionTrack(track);
      dialogs.setShowSectionEditor(true);
    },
    [currentTime, detectedSections, dialogs, duration, selectSection, setCustomRange],
  );

  useEffect(() => {
    if (searchParams.get("mode") !== "replace" || !project || dialogs.showSectionEditor) return;

    const trackWithAudio =
      project.tracks.find(
        (track) => track.audioUrl || track.clips?.[0]?.audioUrl || track.versions?.some((version) => version.audioUrl),
      ) || project.tracks[0];

    if (!trackWithAudio) return;

    // Opened straight from the track menu: show ONLY the replace panel,
    // the studio workspace behind it must stay hidden (no "two windows").
    setReplaceOnlyMode(true);
    openSectionEditorForTrack(trackWithAudio);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("mode");
    setSearchParams(nextParams, { replace: true });
  }, [dialogs.showSectionEditor, openSectionEditorForTrack, project, searchParams, setSearchParams]);

  const handleSectionEditorOpenChange = useCallback(
    (open: boolean) => {
      dialogs.setShowSectionEditor(open);
      if (!open && replaceOnlyMode) {
        setReplaceOnlyMode(false);
        navigate(-1);
      }
    },
    [dialogs, navigate, replaceOnlyMode],
  );

  // ── Track action handler (needs dialog setters) ───────────────────────
  const handleMobileTrackAction = useCallback(
    (trackId: string, action: string) => {
      const track = project?.tracks.find((t) => t.id === trackId);
      if (!track) return;
      switch (action) {
        case "download":
          if (track.audioUrl) window.open(track.audioUrl, "_blank");
          break;
        case "effects":
          dialogs.setSelectedEffectsTrack(track);
          dialogs.setShowEffectsDrawer(true);
          break;
        case "reference":
          toast.info("Функция референса в разработке");
          break;
        case "add_vocals":
          dialogs.setSelectedVocalsTrack(track);
          dialogs.setShowAddVocalsDrawer(true);
          break;
        case "extend":
          dialogs.setSelectedExtendTrack(track);
          dialogs.setShowExtendDialog(true);
          break;
        case "replace_section":
          openSectionEditorForTrack(track);
          break;
        case "transcribe":
          dialogs.setSelectedTranscriptionTrack(track);
          dialogs.setShowTranscriptionPanel(true);
          break;
        case "download_all":
          dialogs.setShowDownloadPanel(true);
          break;
        case "replace_instrumental": {
          const vocalTrack = project?.tracks.find((t) => t.type === "vocal");
          if (vocalTrack) {
            dialogs.setSelectedArrangementTrack(vocalTrack);
            dialogs.setShowArrangementDialog(true);
          } else {
            toast.error("Вокальный трек не найден");
          }
          break;
        }
        case "separate_stems":
          dialogs.setShowStemSeparationDialog(true);
          break;
        case "view_notation":
          dialogs.setSelectedNotationTrack(track);
          dialogs.setShowNotationPanel(true);
          break;
        case "cover":
          if (track.audioUrl) navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(track.audioUrl)}`);
          else toast.error("Нет аудио для референса");
          break;
      }
    },
    [project?.tracks, navigate, dialogs, openSectionEditorForTrack],
  );

  const handleSectionClick = useCallback(
    (section: (typeof detectedSections)[0], index: number) => {
      selectSection(section, index);
      const mainTrack = project?.tracks[0];
      if (mainTrack) {
        openSectionEditorForTrack(mainTrack);
      }
    },
    [selectSection, project?.tracks, openSectionEditorForTrack],
  );

  // ── Display track list ────────────────────────────────────────────────
  const displayTracks = useMemo(() => {
    if (!project?.tracks || project.tracks.length === 0) return [];
    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const stemsPresent = project.tracks.some((t) => stemTypes.includes(t.type));
    let filtered = project.tracks;
    if (stemsPresent && project.tracks.length > 1) {
      filtered = project.tracks.filter((t) => {
        if (stemTypes.includes(t.type)) return true;
        if (t.audioUrl === mainAudioUrl && mainAudioUrl) return false;
        return true;
      });
    }
    const priority: Record<string, number> = {
      vocal: 0,
      instrumental: 1,
      bass: 2,
      drums: 3,
      stem: 4,
      main: 5,
      sfx: 6,
      other: 99,
    };
    return [...filtered].sort((a, b) => (priority[a.type] ?? 50) - (priority[b.type] ?? 50));
  }, [project?.tracks, mainAudioUrl]);

  const hasSoloTracks = useMemo(() => project?.tracks?.some((t) => t.solo) ?? false, [project?.tracks]);

  // ── Loading / empty states ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">Нет открытого проекта</p>
        <Button onClick={() => navigate("/studio-v2")}>Открыть студию</Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "flex flex-col h-dvh bg-background overflow-x-hidden",
        "pt-safe-top",
        isMobile ? "pb-dock-safe" : "pb-safe-bottom",
        className,
      )}
    >
      {!(replaceOnlyMode && dialogs.showSectionEditor) && (
        <>
      <StudioShellHeader
        projectName={project.name}
        trackCount={project.tracks.length}
        isMobile={isMobile}
        viewMode={viewMode}
        onViewModeChange={(v) => setViewMode(v)}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={undo}
        onRedo={redo}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isOfflineCapable={studioOptimizations.isOfflineCapable}
        isOnline={studioOptimizations.isOnline}
        autoSaveStatus={autoSave.status}
        autoSaveLastSavedAt={autoSave.lastSavedAt}
        autoSaveTimeSinceLastSave={autoSave.timeSinceLastSave}
        onBack={handleBack}
        onSave={handleSave}
        onExport={() => dialogs.setShowExportDialog(true)}
        onGenerate={() => dialogs.setShowGenerateSheet(true)}
        onMixerOpen={() => dialogs.setShowMixerSheet(true)}
      />

      <StudioShellContent
        audioUrl={mainAudioUrl || null}
        duration={duration}
        currentTime={audioEngine.isReady ? audioEngine.currentTime : currentTime}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        sections={detectedSections}
        selectedSectionIndex={selectedSectionIndex}
        replacedRanges={replacedRanges}
        onSectionClick={handleSectionClick}
        sourceTrack={
          sourceTrack
            ? {
                suno_task_id: sourceTrack.suno_task_id ?? undefined,
                suno_id: sourceTrack.suno_id ?? undefined,
                lyrics: sourceTrack.lyrics ?? undefined,
              }
            : null
        }
        tracks={displayTracks}
        hasSoloTracks={hasSoloTracks}
        sourceTrackId={sourceTrackId || null}
        stemsExist={hasStems}
        onReorder={reorderTracks}
        onToggleMute={toggleTrackMute}
        onToggleSolo={toggleTrackSolo}
        onVolumeChange={setTrackVolume}
        onRemove={removeTrack}
        onVersionChange={setTrackActiveVersion}
        onTrackAction={handleMobileTrackAction}
        showFallbackWarning={showFallbackWarning}
        activeStemsCount={activeStems.length}
        limitedStems={limitedStems as unknown as React.ComponentProps<typeof StudioShellContent>["limitedStems"]}
        stemProgress={
          <StemSeparationProgress
            task={stemRealtime.activeTask}
            progress={stemRealtime.progress}
            className="mb-2"
          />
        }
        onDismissWarning={dismissWarning}
        onShowAddTrackDialog={() => dialogs.setShowAddTrackDialog(true)}
        isMobile={isMobile}
      />

      {/* Desktop transport bar */}
      {!isMobile && (
        <div className="flex items-center gap-2 xl:gap-3 px-3 py-2 border-b border-border/50 bg-card/50 shrink-0 overflow-hidden flex-wrap">
          <OptimizedTransport
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
            onStop={() => handleSeek(0)}
            onSeek={handleSeek}
            compact={true}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (project.masterVolume === 0) {
                  setMasterVolume(previousMasterVolume); // Restore previous volume
                } else {
                  setPreviousMasterVolume(project.masterVolume); // Save current volume
                  setMasterVolume(0); // Mute
                }
              }}
            >
              {project.masterVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[project.masterVolume]}
              max={1}
              step={0.01}
              onValueChange={(v) => setMasterVolume(v[0])}
              className="w-20 xl:w-32 2xl:w-40"
            />
            <span className="text-xs font-mono text-muted-foreground w-6">
              {Math.round(project.masterVolume * 100)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dialogs.setShowImportDialog(true)}
            className="h-8 w-8 shrink-0"
            title="Импорт аудио"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dialogs.setShowAddTrackDialog(true)}
            className="h-8 px-3 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-1">Дорожка</span>
          </Button>
        </div>
      )}

      {/* Mobile player bar */}
      {isMobile && (
        <MobileStudioPlayerBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          masterVolume={project.masterVolume}
          onPlayPause={handlePlayPause}
          onSkipBack={() => handleSeek(0)}
          onSkipForward={() => handleSeek(duration)}
          onSeek={handleSeek}
          onMasterMuteToggle={() => {
            if (project.masterVolume === 0) {
              setMasterVolume(previousMasterVolume); // Restore previous volume
            } else {
              setPreviousMasterVolume(project.masterVolume); // Save current volume
              setMasterVolume(0); // Mute
            }
          }}
          onOpenActions={() => dialogs.setShowActionsSheet(true)}
        />
      )}
        </>
      )}

      {/* All dialogs & sheets */}
      <StudioShellDialogs
        isMobile={isMobile}
        project={project}
        sourceTrackId={sourceTrackId}
        sourceTrack={sourceTrack}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        audioTracks={audioTracks}
        detectedSections={detectedSections}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isSeparating={isSeparating}
        operationLock={operationLock}
        showActionsSheet={dialogs.showActionsSheet}
        setShowActionsSheet={dialogs.setShowActionsSheet}
        showPresetsSheet={dialogs.showPresetsSheet}
        setShowPresetsSheet={dialogs.setShowPresetsSheet}
        showDashboardSheet={dialogs.showDashboardSheet}
        setShowDashboardSheet={dialogs.setShowDashboardSheet}
        showMixerSheet={dialogs.showMixerSheet}
        setShowMixerSheet={dialogs.setShowMixerSheet}
        showMusicLabSheet={dialogs.showMusicLabSheet}
        setShowMusicLabSheet={dialogs.setShowMusicLabSheet}
        showLyricsSheet={dialogs.showLyricsSheet}
        setShowLyricsSheet={dialogs.setShowLyricsSheet}
        showAddTrackDialog={dialogs.showAddTrackDialog}
        setShowAddTrackDialog={dialogs.setShowAddTrackDialog}
        showImportDialog={dialogs.showImportDialog}
        setShowImportDialog={dialogs.setShowImportDialog}
        showExportDialog={dialogs.showExportDialog}
        setShowExportDialog={dialogs.setShowExportDialog}
        showEffectsDrawer={dialogs.showEffectsDrawer}
        setShowEffectsDrawer={dialogs.setShowEffectsDrawer}
        showAddVocalsDrawer={dialogs.showAddVocalsDrawer}
        setShowAddVocalsDrawer={dialogs.setShowAddVocalsDrawer}
        showExtendDialog={dialogs.showExtendDialog}
        setShowExtendDialog={dialogs.setShowExtendDialog}
        showSectionEditor={dialogs.showSectionEditor}
        setShowSectionEditor={handleSectionEditorOpenChange}
        showGenerateSheet={dialogs.showGenerateSheet}
        setShowGenerateSheet={dialogs.setShowGenerateSheet}
        showDownloadPanel={dialogs.showDownloadPanel}
        setShowDownloadPanel={dialogs.setShowDownloadPanel}
        showSaveVersionDialog={dialogs.showSaveVersionDialog}
        setShowSaveVersionDialog={dialogs.setShowSaveVersionDialog}
        showNotationPanel={dialogs.showNotationPanel}
        setShowNotationPanel={dialogs.setShowNotationPanel}
        showTranscriptionPanel={dialogs.showTranscriptionPanel}
        setShowTranscriptionPanel={dialogs.setShowTranscriptionPanel}
        showArrangementDialog={dialogs.showArrangementDialog}
        setShowArrangementDialog={dialogs.setShowArrangementDialog}
        showInstrumentalResult={dialogs.showInstrumentalResult}
        setShowInstrumentalResult={dialogs.setShowInstrumentalResult}
        showStemSeparationDialog={dialogs.showStemSeparationDialog}
        setShowStemSeparationDialog={dialogs.setShowStemSeparationDialog}
        selectedEffectsTrack={dialogs.selectedEffectsTrack}
        setSelectedEffectsTrack={dialogs.setSelectedEffectsTrack}
        selectedVocalsTrack={dialogs.selectedVocalsTrack}
        setSelectedVocalsTrack={dialogs.setSelectedVocalsTrack}
        selectedExtendTrack={dialogs.selectedExtendTrack}
        setSelectedExtendTrack={dialogs.setSelectedExtendTrack}
        selectedSectionTrack={dialogs.selectedSectionTrack}
        setSelectedSectionTrack={dialogs.setSelectedSectionTrack}
        selectedNotationTrack={dialogs.selectedNotationTrack}
        setSelectedNotationTrack={dialogs.setSelectedNotationTrack}
        selectedTranscriptionTrack={dialogs.selectedTranscriptionTrack}
        setSelectedTranscriptionTrack={dialogs.setSelectedTranscriptionTrack}
        selectedArrangementTrack={dialogs.selectedArrangementTrack}
        setSelectedArrangementTrack={dialogs.setSelectedArrangementTrack}
        instrumentalResultData={dialogs.instrumentalResultData}
        setInstrumentalResultData={dialogs.setInstrumentalResultData}
        trackEffects={dialogs.trackEffects}
        setTrackEffects={dialogs.setTrackEffects}
        onSave={handleSave}
        onExport={() => dialogs.setShowExportDialog(true)}
        onBack={handleBack}
        onAddTrack={handleAddTrack}
        onStemSeparation={handleStemSeparation}
        onSeek={handleSeek}
        pendingGenerationContextRef={dialogs.pendingGenerationContextRef}
      />
    </div>
  );
});
