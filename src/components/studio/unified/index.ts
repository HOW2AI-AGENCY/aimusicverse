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

// Unified Mobile Components (new unified interface)
export { MobileStudioPlayerBar } from './MobileStudioPlayerBar';
export { StudioActionsSheet } from './StudioActionsSheet';
export { StudioWaveformTimeline } from './StudioWaveformTimeline';
export { StudioSectionOverlay } from './StudioSectionOverlay';
export { StudioDownloadPanel } from './StudioDownloadPanel';
export { StudioTranscriptionPanel } from './StudioTranscriptionPanel';

// Re-export hooks for convenience
export { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
export { useStudioPerformance, useThrottledCallback, useCustomDeferredValue } from '@/hooks/useStudioPerformance';
