/**
 * Onboarding Components Barrel Export
 * 
 * @module components/onboarding
 */

// Main onboarding overlay
export { OnboardingOverlay } from './OnboardingOverlay';
export { useOnboarding, useShouldShowOnboarding } from '@/hooks/useOnboarding';

// Tutorial components
export { TutorialStep } from './TutorialStep';
export { FeatureTutorialDialog, TUTORIAL_SLIDES } from './FeatureTutorialDialog';
export type { TutorialSlide } from './FeatureTutorialDialog';

// Contextual tips
export { 
  ContextualOnboardingTip, 
  useContextualTip, 
  CONTEXTUAL_TIPS 
} from './ContextualOnboardingTip';
export type { OnboardingTipConfig } from './ContextualOnboardingTip';

// Quick tips
export { QuickTipToast, useQuickTip } from './QuickTipToast';

// Step cards and tooltips
export { OnboardingStepCard } from './OnboardingStepCard';
export { OnboardingTooltip, useOnboardingStatus, resetOnboarding } from './OnboardingTooltip';
export { OnboardingTrigger } from './OnboardingTrigger';
export { FeatureHighlight } from './FeatureHighlight';

// Specialized onboarding flows
export { ProfileSetupOnboarding } from './ProfileSetupOnboarding';
export { TelegramOnboarding } from './TelegramOnboarding';
export { QuickStartOverlay } from './QuickStartOverlay';

// Steps data
export { ONBOARDING_STEPS } from './onboardingSteps';
export type { OnboardingStep } from './onboardingSteps';
