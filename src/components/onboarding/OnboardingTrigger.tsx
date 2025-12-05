import { useEffect } from 'react';
import { useOnboarding, useShouldShowOnboarding } from '@/hooks/useOnboarding';

/**
 * Component that auto-starts onboarding for first-time users
 * Place this in MainLayout to trigger on first app load
 */
export function OnboardingTrigger() {
  const shouldShow = useShouldShowOnboarding();
  const { startOnboarding, isActive } = useOnboarding();

  useEffect(() => {
    // Auto-start onboarding for first-time users after a short delay
    if (shouldShow && !isActive) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500); // Give the UI time to load first
      
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isActive, startOnboarding]);

  return null;
}
