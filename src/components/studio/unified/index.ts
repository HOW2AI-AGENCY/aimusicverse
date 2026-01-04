/**
 * Unified Studio Components
 * 
 * Components for the integrated studio experience combining
 * section replacement and stem mixing in one interface.
 */

export { UnifiedStudioContent } from './UnifiedStudioContent';
export { IntegratedStemTracks } from './IntegratedStemTracks';
export { SectionVariantOverlay } from './SectionVariantOverlay';
export { StudioActivityLog } from './StudioActivityLog';
export { EnhancedVersionTimeline } from './EnhancedVersionTimeline';
export { StemMidiDrawer } from './StemMidiDrawer';
export { StemEffectsDrawer } from './StemEffectsDrawer';
export { AddTrackDrawer } from './AddTrackDrawer';
export { StudioShell } from './StudioShell';
export { SortableTrackList } from './SortableTrackList';
export { AutoSaveIndicator } from './AutoSaveIndicator';
export { 
  StudioLoadingSkeleton, 
  TrackRowSkeleton, 
  TimelineRulerSkeleton,
  SectionsSkeleton,
  TransportSkeleton,
  WaveformSkeleton,
  MixerPanelSkeleton,
} from './StudioSkeletons';

// Unified Mobile Components (new unified DAW interface - NO tabs)
export { UnifiedStudioMobile } from './UnifiedStudioMobile';
export { UnifiedDAWLayout } from './UnifiedDAWLayout';
export { MobileStudioPlayerBar } from './MobileStudioPlayerBar';
export { StudioActionsSheet } from './StudioActionsSheet';
export { StudioWaveformTimeline } from './StudioWaveformTimeline';
export { StudioSectionOverlay } from './StudioSectionOverlay';
export { StudioDownloadPanel } from './StudioDownloadPanel';
export { StudioTranscriptionPanel } from './StudioTranscriptionPanel';
export { StudioNotationPanel } from './StudioNotationPanel';
export { SaveVersionDialog } from './SaveVersionDialog';
export { PianoRoll } from './PianoRoll';
export type { MidiNote } from './PianoRoll';

// DAW Canvas Components (ADR-011 - unified interface)
export { AIActionsFAB } from './AIActionsFAB';
export { MobileDAWTimeline } from './MobileDAWTimeline';

// Mixer Components
export { MobileMixerContent } from './MobileMixerContent';
export { MixerChannel } from './MixerChannel';
export { AudioMeter, StereoMeter, SimpleMeter } from './AudioMeter';
export { StemActionSheet } from './StemActionSheet';

// Legacy tab-based components (deprecated - will be removed)
// Kept for backward compatibility during migration
export { MobileStudioLayout } from './MobileStudioLayout';
export { MobileStudioTabs } from './MobileStudioTabs';

// Re-export hooks for convenience
export { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
export { useStudioPerformance, useThrottledCallback, useCustomDeferredValue } from '@/hooks/useStudioPerformance';
export { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';
export { useStudioMixer } from '@/hooks/studio/useStudioMixer';

// Re-export configs
export { getActionsForStemType, getGroupedActions, CATEGORY_LABELS, normalizeTrackType } from '@/hooks/studio/stemActionsConfig';
export { MIX_PRESETS, getMixPreset } from '@/hooks/studio/mixPresetsConfig';

// Type exports
export type { UnifiedStudioMobileProps } from './UnifiedStudioMobile';
export type { StemAction, StemType } from '@/hooks/studio/stemActionsConfig';
export type { MixPreset, StemMixSettings } from '@/hooks/studio/mixPresetsConfig';
export type { MixerTrack, UseStudioMixerReturn } from '@/hooks/studio/useStudioMixer';
