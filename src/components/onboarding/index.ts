/**
 * Onboarding Components Barrel Export
 *
 * Hint/tooltip exports have moved to `@/components/hints`
 * (HintRegistry, useHint, UnifiedTipCard, ContextHints).
 *
 * @module components/onboarding
 */

// Main onboarding overlay
export { OnboardingOverlay } from "./OnboardingOverlay";
export { useOnboarding, useShouldShowOnboarding } from "@/hooks/useOnboarding";

// Tutorial components
export { TutorialStep } from "./TutorialStep";
export { FeatureTutorialDialog, TUTORIAL_SLIDES } from "./FeatureTutorialDialog";
export type { TutorialSlide } from "./FeatureTutorialDialog";

// Quick tips → use `@/components/hints` (UnifiedTipCard / ContextHints)

// Step cards
export { OnboardingStepCard } from "./OnboardingStepCard";
export { OnboardingTrigger } from "./OnboardingTrigger";
export { FeatureHighlight } from "./FeatureHighlight";

// Specialized onboarding flows
export { ProfileSetupOnboarding } from "./ProfileSetupOnboarding";
export { TelegramOnboarding } from "./TelegramOnboarding";
export { QuickStartOverlay } from "./QuickStartOverlay";

// Steps data
export { ONBOARDING_STEPS } from "./onboardingSteps";
export type { OnboardingStep } from "./onboardingSteps";
