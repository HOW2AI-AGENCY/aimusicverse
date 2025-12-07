import { Track } from '@/hooks/useTracksOptimized';
import { ActionId, TRACK_ACTIONS } from '@/config/trackActionsConfig';

export interface TrackActionState {
  stemCount: number;
  versionCount: number;
  hasVideo: boolean;
  isVideoGenerating: boolean;
}

/**
 * Check if an action is available for a given track
 */
export function isActionAvailable(
  actionId: ActionId,
  track: Track,
  state: TrackActionState
): boolean {
  const action = TRACK_ACTIONS[actionId];
  if (!action) return false;

  const isCompleted = track.status === 'completed';
  const hasAudio = !!track.audio_url;

  // Basic requirements
  if (action.requiresCompleted && !isCompleted) return false;
  if (action.requiresAudio && !hasAudio) return false;
  if (action.requiresSunoId && !track.suno_id) return false;
  if (action.requiresSunoTaskId && !track.suno_task_id) return false;

  // Action-specific conditions
  switch (actionId) {
    case 'watch_video':
      return state.hasVideo;

    case 'open_studio':
      return state.stemCount > 0;

    case 'stems_simple':
    case 'stems_detailed':
      return !!track.suno_id && state.stemCount === 0;

    case 'add_vocals':
      return isCompleted && (track.is_instrumental === true || track.has_vocals === false);

    case 'add_instrumental':
      return isCompleted && track.has_vocals === true;

    case 'lyrics':
      return hasAudio && isCompleted && !!(track.lyrics || (track.suno_task_id && track.suno_id));

    case 'generate_video':
      return !!track.suno_id && !!track.suno_task_id && !state.hasVideo && !state.isVideoGenerating;

    default:
      return true;
  }
}

/**
 * Get action label with dynamic text
 */
export function getActionLabel(
  actionId: ActionId,
  track: Track,
  state: TrackActionState
): string {
  switch (actionId) {
    case 'toggle_public':
      return track.is_public ? 'Сделать приватным' : 'Сделать публичным';

    case 'add_instrumental':
      return state.stemCount > 0 ? 'Новая аранжировка' : 'Добавить инструментал';

    case 'generate_video':
      if (state.isVideoGenerating) return 'Видео создаётся...';
      if (state.hasVideo) return 'Видео готово';
      return 'Создать видеоклип';

    case 'open_studio':
      return `Открыть в студии`;

    default:
      return TRACK_ACTIONS[actionId]?.label || '';
  }
}

/**
 * Get action icon override for dynamic states
 */
export function getActionIcon(
  actionId: ActionId,
  track: Track,
  state: TrackActionState
): { icon: any; className?: string } | null {
  switch (actionId) {
    case 'toggle_public':
      return {
        icon: track.is_public ? 
          require('lucide-react').Lock : 
          require('lucide-react').Globe,
      };

    case 'generate_video':
      if (state.isVideoGenerating) {
        return {
          icon: require('lucide-react').Loader2,
          className: 'animate-spin',
        };
      }
      if (state.hasVideo) {
        return {
          icon: require('lucide-react').CheckCircle2,
          className: 'text-green-500',
        };
      }
      return null;

    default:
      return null;
  }
}

/**
 * Check if an action is disabled (visible but not interactive)
 */
export function isActionDisabled(
  actionId: ActionId,
  track: Track,
  state: TrackActionState,
  isProcessing: boolean
): boolean {
  if (isProcessing) return true;

  switch (actionId) {
    case 'generate_video':
      return state.isVideoGenerating || state.hasVideo;

    default:
      return false;
  }
}

/**
 * Get tooltip for disabled action
 */
export function getDisabledTooltip(
  actionId: ActionId,
  track: Track,
  state: TrackActionState
): string | null {
  switch (actionId) {
    case 'stems_simple':
    case 'stems_detailed':
      if (state.stemCount > 0) return 'Стемы уже созданы';
      if (!track.suno_id) return 'Требуется Suno ID';
      return null;

    case 'generate_video':
      if (state.hasVideo) return 'Видео уже создано';
      if (state.isVideoGenerating) return 'Видео создаётся...';
      return null;

    case 'add_vocals':
      if (track.has_vocals) return 'Трек уже содержит вокал';
      return null;

    default:
      return null;
  }
}

/**
 * Get visible actions for a track with current state
 */
export function getVisibleActions(
  track: Track,
  state: TrackActionState,
  category?: string
): ActionId[] {
  const allActions = Object.keys(TRACK_ACTIONS) as ActionId[];
  
  return allActions.filter(actionId => {
    const action = TRACK_ACTIONS[actionId];
    
    // Filter by category if specified
    if (category && action.category !== category) return false;
    
    // Check if action is available
    return isActionAvailable(actionId, track, state);
  });
}
