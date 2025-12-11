/**
 * Studio Components Export
 * Part of Sprint 015-A: Unified Studio Architecture
 */

// Core Components
export { StudioProvider, useStudio } from './StudioProvider';
export { StemMixer } from './StemMixer';
export { StudioQuickActions } from './StudioQuickActions';
export { StemSeparationPrompt } from './StemSeparationPrompt';

// Legacy (for backwards compatibility)
export { StudioLayout } from './StudioLayout';
export { StudioHeader } from './StudioHeader';
export { StudioTabNavigation } from './StudioTabNavigation';
export { StudioPlayer } from './StudioPlayer';
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
