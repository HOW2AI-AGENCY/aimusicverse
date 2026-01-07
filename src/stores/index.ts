/**
 * Stores Barrel Export
 * 
 * Central export for all Zustand stores and slices.
 */

// ============ Slices ============
export * from './slices';

// ============ Standalone Stores ============
export { useStemMixerStore, useStemState, useStemActions, useMasterControls, useEffectiveStemVolume, useIsStemMuted } from './useStemMixerStore';
export { usePlaybackStore, usePlaybackStatus, usePlaybackControls, useLoopControls, usePlaybackProgress, usePlaybackLoadingState } from './usePlaybackStore';

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
