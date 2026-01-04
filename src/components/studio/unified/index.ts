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

// Unified Mobile Components (new unified DAW interface - NO tabs)
export { UnifiedStudioMobile } from './UnifiedStudioMobile';
export { UnifiedDAWLayout } from './UnifiedDAWLayout';
export { MobileStudioPlayerBar } from './MobileStudioPlayerBar';
export { StudioActionsSheet } from './StudioActionsSheet';
export { StudioWaveformTimeline } from './StudioWaveformTimeline';
export { StudioSectionOverlay } from './StudioSectionOverlay';
export { StudioDownloadPanel } from './StudioDownloadPanel';
export { StudioTranscriptionPanel } from './StudioTranscriptionPanel';

// DAW Canvas Components (ADR-011 - unified interface)
export { AIActionsFAB } from './AIActionsFAB';
export { MobileDAWTimeline } from './MobileDAWTimeline';

// Legacy tab-based components (deprecated - will be removed)
// Kept for backward compatibility during migration
export { MobileStudioLayout } from './MobileStudioLayout';
export { MobileStudioTabs } from './MobileStudioTabs';

// Re-export hooks for convenience
export { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
export { useStudioPerformance, useThrottledCallback, useCustomDeferredValue } from '@/hooks/useStudioPerformance';
export { useUnifiedStudio } from '@/hooks/studio/useUnifiedStudio';

// Type exports
export type { UnifiedStudioMobileProps } from './UnifiedStudioMobile';
