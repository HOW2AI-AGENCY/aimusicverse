import { OnboardingSlider } from './OnboardingSlider';
import { useOnboarding } from '@/hooks/useOnboarding';

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  if (!shouldShowOnboarding) {
    return null;
  }

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  const handleSkip = () => {
    skipOnboarding();
    onComplete();
  };

  return (
    <OnboardingSlider onComplete={handleComplete} onSkip={handleSkip} />
  );
};
