/**
 * Studio Components Export
 * Part of Sprint 015-A: Unified Studio Architecture
 */

export { StudioLayout } from './StudioLayout';
export { StudioHeader } from './StudioHeader';
export { StudioTabNavigation } from './StudioTabNavigation';
export { StudioPlayer } from './StudioPlayer';
export { StudioProvider, useStudio } from './StudioProvider';

// Tab contents
export { PlayerTabContent, ToolsTabContent, ExportTabContent } from './tabs';

// Re-export store and types
export { 
  useStudioStore,
  selectAudio,
  selectTrack,
  selectMode,
  selectActiveTab,
  selectIsPlaying,
  selectCurrentTime,
  selectDuration,
} from '@/stores/useStudioStore';

export type { 
  StudioMode, 
  StudioTab, 
  AudioState, 
  TrackInfo,
  StudioState,
} from '@/stores/useStudioStore';
