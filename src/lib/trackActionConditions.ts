import React from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId, TRACK_ACTIONS } from '@/config/trackActionsConfig';
import { Lock, Globe, Loader2, CheckCircle2 } from 'lucide-react';

export interface TrackActionState {
  stemCount: number;
  versionCount: number;
  hasVideo: boolean;
  isVideoGenerating: boolean;
  hasVocalStem?: boolean;
  hasInstrumentalStem?: boolean;
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

    case 'cover':
      return isCompleted && hasAudio;

    case 'new_arrangement':
      // Requires stems with vocal stem available
      return isCompleted && state.stemCount > 0 && state.hasVocalStem === true;

    case 'new_vocal':
      // Requires stems with instrumental stem available
      return isCompleted && state.stemCount > 0 && state.hasInstrumentalStem === true;

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

    case 'new_arrangement':
      return 'Новая аранжировка';

    case 'new_vocal':
      return 'Новый вокал';

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
): { icon: React.ComponentType<any>; className?: string } | null {
  switch (actionId) {
    case 'toggle_public':
      return {
        icon: track.is_public ? Lock : Globe,
      };

    case 'generate_video':
      if (state.isVideoGenerating) {
        return {
          icon: Loader2,
          className: 'animate-spin',
        };
      }
      if (state.hasVideo) {
        return {
          icon: CheckCircle2,
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

    case 'new_vocal':
      if (state.stemCount === 0) return 'Сначала разделите трек на стемы';
      if (!state.hasInstrumentalStem) return 'Инструментальный стем не найден';
      return null;

    case 'new_arrangement':
      if (state.stemCount === 0) return 'Сначала разделите трек на стемы';
      if (!state.hasVocalStem) return 'Вокальный стем не найден';
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
