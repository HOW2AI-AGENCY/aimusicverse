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

// Action components
export { StudioActionsPanel } from './actions/StudioActionsPanel';
export type { StudioTrackState, StemActionType } from './actions/StudioActionsPanel';
export { StemActionSheet } from './actions/StemActionSheet';

// Hooks
export { useEnhancedStudioLogger } from './hooks/useEnhancedStudioLogger';
export type { StudioAction, StudioState } from './hooks/useEnhancedStudioLogger';
export { useStudioTrackState } from './hooks/useStudioTrackState';
