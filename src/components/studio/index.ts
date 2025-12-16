/**
 * Studio Components Module
 * Unified exports for studio interface components
 */

// Layout components
export { StudioHeader } from './layout/StudioHeader';
export { StudioPlayerBar } from './layout/StudioPlayerBar';

// Panel components
export { StudioActionsPanel } from './panels/StudioActionsPanel';

// Shared components
export { VersionTree } from './shared/VersionTree';
export { EnhancedContextTips } from './shared/EnhancedContextTips';
export { StudioOnboarding, useStudioOnboarding } from './shared/StudioOnboarding';

// Mobile components
export { MobileStudioLayout } from './mobile/MobileStudioLayout';
export { MobileActionsContent } from './mobile/MobileActionsContent';

// Hooks
export { useEnhancedStudioLogger } from './hooks/useEnhancedStudioLogger';
export type { StudioAction, StudioState } from './hooks/useEnhancedStudioLogger';
