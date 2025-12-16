/**
 * Studio Components Module
 * Unified exports for studio interface components
 */

// Layout components
export { StudioHeader } from './layout/StudioHeader';
export { StudioPlayerBar } from './layout/StudioPlayerBar';
export { UnifiedStudioLayout } from './layout/UnifiedStudioLayout';
export { AdaptivePlayerBar } from './layout/AdaptivePlayerBar';

// Panel components
export { StudioActionsPanel } from './panels/StudioActionsPanel';

// Timeline components
export { ProfessionalWaveformTimeline } from './timeline/ProfessionalWaveformTimeline';

// Editor components
export { SmartSectionEditor } from './editor/SmartSectionEditor';

// Actions components
export { StudioActionsFAB } from './actions/StudioActionsFAB';

// Shared components
export { VersionTree } from './shared/VersionTree';
export { EnhancedContextTips } from './shared/EnhancedContextTips';
export { StudioOnboarding, useStudioOnboarding } from './shared/StudioOnboarding';

// Mobile components
export { MobileStudioLayout } from './mobile/MobileStudioLayout';
export { MobileActionsContent } from './mobile/MobileActionsContent';
export { MobileMainTab } from './mobile/MobileMainTab';
export { MobileEditTab } from './mobile/MobileEditTab';

// Hooks
export { useEnhancedStudioLogger } from './hooks/useEnhancedStudioLogger';
export type { StudioAction, StudioState } from './hooks/useEnhancedStudioLogger';
