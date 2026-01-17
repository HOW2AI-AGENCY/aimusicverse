import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/types/track';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useVideoGenerationStatus } from '@/hooks/useVideoGenerationStatus';
import { useTrackActions } from '@/hooks/useTrackActions';
import { useAudioUpscale } from '@/hooks/useAudioUpscale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, isActionDisabled } from '@/lib/trackActionConditions';

interface UseTrackActionsStateProps {
  track: Track;
  onDelete?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
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
}

export function useTrackActionsState({
  track,
  onDelete,
  onDownload,
  onClose,
}: UseTrackActionsStateProps) {
  const navigate = useNavigate();
  
  // State
  const [stemCount, setStemCount] = useState(0);
  const [versionCount, setVersionCount] = useState(0);
  const [stems, setStems] = useState<Array<{ id: string; stem_type: string; audio_url: string }>>([]);
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
  });

  // Hooks - lazy load video status only when needed
  const [shouldFetchVideoStatus, setShouldFetchVideoStatus] = useState(false);
  const videoStatus = useVideoGenerationStatus(shouldFetchVideoStatus ? track?.id : undefined);
  const { isGenerating: isVideoGenerating, hasVideo } = videoStatus;
  const {
    isProcessing,
    handleShare,
    handleRemix,
    handleSeparateVocals,
    handleTogglePublic,
    handleConvertToWav,
    handleGenerateCover,
    handleGenerateVideo,
    handleSendToTelegram,
  } = useTrackActions();
  const { upscale: upscaleAudio, isLoading: isUpscaling } = useAudioUpscale();
  const { addToQueue, queue } = usePlayerStore();

  // Fetch counts and stems
  useEffect(() => {
    if (!track?.id) return;

    const fetchData = async () => {
      const [stemsResult, versionsResult] = await Promise.all([
        supabase
          .from('track_stems')
          .select('id, stem_type, audio_url')
          .eq('track_id', track.id),
        supabase
          .from('track_versions')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', track.id),
      ]);
      
      const stemsData = stemsResult.data || [];
      setStems(stemsData);
      setStemCount(stemsData.length);
      setVersionCount(versionsResult.count || 0);
    };

    fetchData();
  }, [track?.id]);

  // Check for specific stem types
  const hasVocalStem = stems.some(s => s.stem_type === 'vocal' || s.stem_type === 'vocals');
  const hasInstrumentalStem = stems.some(s => s.stem_type === 'instrumental');
  
  // Check if track is instrumental:
  // 1. Explicit is_instrumental flag from database
  // 2. has_vocals is explicitly false
  // 3. Style contains "instrumental"
  // 4. Has instrumental stem but no vocal stem
  const isInstrumentalTrack = !!(
    track.is_instrumental === true ||
    track.has_vocals === false ||
    track.style?.toLowerCase().includes('instrumental') ||
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
  const openDialog = useCallback((key: keyof DialogStates) => {
    setDialogs(prev => ({ ...prev, [key]: true }));
    onClose?.();
  }, [onClose]);

  const closeDialog = useCallback((key: keyof DialogStates) => {
    setDialogs(prev => ({ ...prev, [key]: false }));
  }, []);

  // Action handlers
  const executeAction = useCallback(async (actionId: ActionId) => {
    if (!track) return;

    // Check if action is available
    if (!isActionAvailable(actionId, track, actionState)) {
      toast.error('Действие недоступно');
      return;
    }

    // Check if action is disabled
    if (isActionDisabled(actionId, track, actionState, isProcessing)) {
      return;
    }

    triggerHapticFeedback('light');

    switch (actionId) {
      // Info actions
      case 'details':
        openDialog('details');
        break;
      case 'toggle_public':
        await handleTogglePublic(track);
        onClose?.();
        break;
      case 'rename':
        openDialog('rename');
        break;

      // Download actions
      case 'download_mp3':
        onDownload?.();
        onClose?.();
        break;
      case 'download_wav':
        await handleConvertToWav(track);
        onClose?.();
        break;
      case 'download_stems':
        // Navigate to studio for stem download
        navigate(`/studio-v2/track/${track.id}`);
        onClose?.();
        break;

      // Share actions
      case 'generate_video':
        await handleGenerateVideo(track);
        onClose?.();
        break;
      case 'send_telegram':
        await handleSendToTelegram(track);
        onClose?.();
        break;
      case 'copy_link':
        await handleShare(track);
        onClose?.();
        break;
      case 'add_to_playlist':
        openDialog('addToPlaylist');
        break;
      case 'add_to_project':
        openDialog('addToProject');
        break;

      // Studio actions
      case 'open_studio':
        navigate(`/studio-v2/track/${track.id}`);
        onClose?.();
        break;
      case 'replace_section':
        navigate(`/studio-v2/track/${track.id}?mode=replace`);
        onClose?.();
        break;
      case 'stems_simple':
        await handleSeparateVocals(track, 'simple');
        // Автоматически открыть студию после запуска разделения
        navigate(`/studio-v2/track/${track.id}?stems=pending`);
        onClose?.();
        break;
      case 'stems_detailed':
        await handleSeparateVocals(track, 'detailed');
        // Автоматически открыть студию после запуска разделения
        navigate(`/studio-v2/track/${track.id}?stems=pending`);
        onClose?.();
        break;
      case 'transcribe_midi':
        navigate(`/studio-v2/track/${track.id}?mode=midi`);
        onClose?.();
        break;
      case 'transcribe_notes':
        navigate(`/studio-v2/track/${track.id}?mode=notes`);
        onClose?.();
        break;

      // Create actions
      case 'generate_cover':
        await handleGenerateCover(track);
        onClose?.();
        break;
      case 'cover':
        openDialog('cover');
        break;
      case 'extend':
        openDialog('extend');
        break;
      case 'remix':
        await handleRemix(track);
        onClose?.();
        break;
      case 'create_artist_persona':
        openDialog('createArtist');
        break;
      case 'add_vocals':
        openDialog('addVocals');
        break;
      case 'add_instrumental':
        openDialog('addInstrumental');
        break;

      // Quality actions
      case 'upscale_hd':
        if (track.audio_url) {
          await upscaleAudio({ audioUrl: track.audio_url, trackId: track.id });
        }
        onClose?.();
        break;

      // Delete actions
      case 'delete_version':
        openDialog('deleteVersionSelect');
        break;
      case 'delete_all':
        openDialog('deleteConfirm');
        break;
    }
  }, [
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
    handleRemix,
    handleTogglePublic,
    handleShare,
    upscaleAudio,
  ]);

  const handleConfirmDelete = useCallback(() => {
    triggerHapticFeedback('success');
    onDelete?.();
    closeDialog('deleteConfirm');
  }, [onDelete, closeDialog]);

  return {
    // State
    stemCount,
    versionCount,
    actionState,
    isProcessing,
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
