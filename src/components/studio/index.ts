/**
 * Studio Components Module
 * Unified exports for studio interface components
 */

// Layout components
export { StudioHeader } from './layout/StudioHeader';
export { StudioPlayerBar } from './layout/StudioPlayerBar';
export { CleanStudioLayout } from './layout/CleanStudioLayout';

// Editor components
export { SectionEditorSheet } from './editor/SectionEditorSheet';
export { WaveformRangeSelector } from './editor/WaveformRangeSelector';
export { SynchronizedSectionLyrics } from './editor/SynchronizedSectionLyrics';
export { SectionReplacementHistory } from './editor/SectionReplacementHistory';
export { CrossfadePreview } from './editor/CrossfadePreview';
export { ReplacementTimelineOverlay } from './editor/ReplacementTimelineOverlay';

// Action components
export { StudioActionsPanel } from './actions/StudioActionsPanel';
export type { StudioTrackState, StemActionType } from './actions/StudioActionsPanel';
export { StemActionSheet } from './actions/StemActionSheet';

// Multi-track DAW components
export { MultiTrackStudioLayout } from './MultiTrackStudioLayout';
export { AddTrackDialog } from './AddTrackDialog';
export { SFXGeneratorPanel } from './SFXGeneratorPanel';
export { InstrumentalGeneratorPanel } from './InstrumentalGeneratorPanel';

// Timeline components
export * from './timeline';

// Hooks
export { useEnhancedStudioLogger } from './hooks/useEnhancedStudioLogger';
export type { StudioAction, StudioState } from './hooks/useEnhancedStudioLogger';
export { useStudioTrackState } from './hooks/useStudioTrackState';

// Unified studio components
export { UnifiedStudioContent } from './unified/UnifiedStudioContent';
export { IntegratedStemTracks } from './unified/IntegratedStemTracks';
export { SectionVariantOverlay } from './unified/SectionVariantOverlay';
export { StudioVersionSelector } from './unified/StudioVersionSelector';
export { StudioPendingTrackRow } from './unified/StudioPendingTrackRow';

// Mobile studio components
export { MobileStudioLayout } from './unified/MobileStudioLayout';
export { MobileStudioTabs } from './unified/MobileStudioTabs';
export type { MobileStudioTab } from './unified/MobileStudioTabs';
export { MobilePlayerContent } from './unified/MobilePlayerContent';
export { MobileTracksContent } from './unified/MobileTracksContent';
export { MobileSectionsContent } from './unified/MobileSectionsContent';
export { MobileMixerContent } from './unified/MobileMixerContent';
export { MobileActionsContent } from './unified/MobileActionsContent';

// Unified layout
export { UnifiedStudioLayout } from './layout/UnifiedStudioLayout';

// Loading and transcription indicators
export { StemsLoadingProgress } from './StemsLoadingProgress';
export { TranscriptionInProgress, TranscriptionPlaceholder } from './TranscriptionInProgress';
export { StemNotesPreview, StemNotesPreviewSkeleton } from './StemNotesPreview';

// Skeleton and virtualization
export { StemTrackSkeleton, SingleStemSkeleton } from './StemTrackSkeleton';
export { VirtualizedStemList } from './VirtualizedStemList';

// Offline and loading progress
export { OfflineIndicator } from './OfflineIndicator';
export { AudioLoadingProgress } from './AudioLoadingProgress';

// Error handling and warnings
export { AudioErrorBoundary, useAudioErrorHandler } from './AudioErrorBoundary';
export { MobileAudioWarning } from './MobileAudioWarning';
export { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

// Undo/Redo
export { UndoRedoControls } from './UndoRedoControls';
