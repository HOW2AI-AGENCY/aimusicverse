import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerStore } from '@/hooks/audio';
import { useVideoGenerationStatus } from '@/hooks/useVideoGenerationStatus';
import { useTrackActions } from '@/hooks/useTrackActions';
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
  lyrics: boolean;
  extend: boolean;
  cover: boolean;
  addVocals: boolean;
  addInstrumental: boolean;
  createArtist: boolean;
  addToProject: boolean;
  share: boolean;
  addToPlaylist: boolean;
  deleteConfirm: boolean;
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
  const [dialogs, setDialogs] = useState<DialogStates>({
    details: false,
    lyrics: false,
    extend: false,
    cover: false,
    addVocals: false,
    addInstrumental: false,
    createArtist: false,
    addToProject: false,
    share: false,
    addToPlaylist: false,
    deleteConfirm: false,
  });

  // Hooks
  const { isGenerating: isVideoGenerating, hasVideo } = useVideoGenerationStatus(track?.id);
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
  const { addToQueue, queue } = usePlayerStore();

  // Fetch counts
  useEffect(() => {
    if (!track?.id) return;

    const fetchCounts = async () => {
      const [stemsResult, versionsResult] = await Promise.all([
        supabase
          .from('track_stems')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', track.id),
        supabase
          .from('track_versions')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', track.id),
      ]);
      
      setStemCount(stemsResult.count || 0);
      setVersionCount(versionsResult.count || 0);
    };

    fetchCounts();
  }, [track?.id]);

  // Action state for condition checks
  const actionState: TrackActionState = {
    stemCount,
    versionCount,
    hasVideo,
    isVideoGenerating,
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
      // Queue actions
      case 'play_next': {
        const newQueue = [...queue];
        const currentIndex = usePlayerStore.getState().currentIndex;
        newQueue.splice(currentIndex + 1, 0, track);
        usePlayerStore.setState({ queue: newQueue });
        toast.success('Будет воспроизведено следующим');
        onClose?.();
        break;
      }
      case 'add_to_queue':
        addToQueue(track);
        toast.success('Добавлено в очередь');
        onClose?.();
        break;
      case 'watch_video':
        openDialog('details');
        break;

      // Share actions
      case 'download':
        onDownload?.();
        onClose?.();
        break;
      case 'share':
        openDialog('share');
        break;
      case 'send_telegram':
        await handleSendToTelegram(track);
        onClose?.();
        break;

      // Organize actions
      case 'add_to_playlist':
        openDialog('addToPlaylist');
        break;
      case 'add_to_project':
        openDialog('addToProject');
        break;
      case 'create_artist':
        openDialog('createArtist');
        break;

      // Studio actions
      case 'open_studio':
        navigate(`/studio/${track.id}`);
        onClose?.();
        break;
      case 'stems_simple':
        await handleSeparateVocals(track, 'simple');
        onClose?.();
        break;
      case 'stems_detailed':
        await handleSeparateVocals(track, 'detailed');
        onClose?.();
        break;
      case 'generate_cover':
        await handleGenerateCover(track);
        onClose?.();
        break;
      case 'convert_wav':
        await handleConvertToWav(track);
        onClose?.();
        break;
      case 'transcribe_midi':
        toast.info('Транскрипция в MIDI скоро будет доступна!');
        onClose?.();
        break;
      case 'generate_video':
        await handleGenerateVideo(track);
        onClose?.();
        break;

      // Edit actions
      case 'extend':
        openDialog('extend');
        break;
      case 'cover':
        openDialog('cover');
        break;
      case 'add_vocals':
        openDialog('addVocals');
        break;
      case 'add_instrumental':
        openDialog('addInstrumental');
        break;
      case 'remix':
        await handleRemix(track);
        onClose?.();
        break;

      // Info actions
      case 'details':
        openDialog('details');
        break;
      case 'lyrics':
        openDialog('lyrics');
        break;
      case 'toggle_public':
        await handleTogglePublic(track);
        onClose?.();
        break;

      // Danger actions
      case 'delete':
        openDialog('deleteConfirm');
        break;
    }
  }, [
    track,
    actionState,
    isProcessing,
    queue,
    addToQueue,
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
    
    // Dialogs
    dialogs,
    openDialog,
    closeDialog,
    
    // Actions
    executeAction,
    handleConfirmDelete,
    
    // Helpers
    isActionAvailable: (actionId: ActionId) => isActionAvailable(actionId, track, actionState),
    isActionDisabled: (actionId: ActionId) => isActionDisabled(actionId, track, actionState, isProcessing),
  };
}
