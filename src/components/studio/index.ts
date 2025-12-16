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

// Hooks
export { useEnhancedStudioLogger } from './hooks/useEnhancedStudioLogger';
export type { StudioAction, StudioState } from './hooks/useEnhancedStudioLogger';
