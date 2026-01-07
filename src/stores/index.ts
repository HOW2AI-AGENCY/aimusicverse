/**
 * Stores Barrel Export
 * 
 * Central export for all Zustand stores and slices.
 */

// ============ Slices ============
// Note: Import slices directly: import { createStemMixerSlice } from '@/stores/slices/stemMixerSlice';

// ============ Standalone Stores ============
// Note: Import new stores directly to avoid potential circular deps:
// import { useStemMixerStore } from '@/stores/useStemMixerStore';
// import { usePlaybackStore } from '@/stores/usePlaybackStore';

// ============ Full Stores ============
export { useUnifiedStudioStore, TRACK_COLORS } from './useUnifiedStudioStore';
export type {
  TrackType,
  ProjectStatus,
  StemsMode,
  ViewMode,
  StudioClip,
  StudioTrack,
  StudioTrackVersion,
  StudioProject,
  ViewSettings,
  CreateProjectParams,
  StudioLyricVersion,
  StudioSectionNote,
} from './useUnifiedStudioStore';

export { useStudioProjectStore } from './useStudioProjectStore';
export { useSectionEditorStore } from './useSectionEditorStore';
export { useLyricsHistoryStore } from './useLyricsHistoryStore';
export { useMixerHistoryStore } from './useMixerHistoryStore';
export { useStemReferenceStore } from './stemReferenceStore';
export { useLyricsWizardStore } from './lyricsWizardStore';
export { usePlanTrackStore } from './planTrackStore';
