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
