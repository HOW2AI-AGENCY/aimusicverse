import { useState, useEffect } from 'react';
import { useProfileSetupCheck } from '@/hooks/useProfileSetupCheck';
import { MandatoryProfileSetup } from './MandatoryProfileSetup';

interface ProfileSetupGuardProps {
  children: React.ReactNode;
}

export function ProfileSetupGuard({ children }: ProfileSetupGuardProps) {
  const { needsSetup, isLoading } = useProfileSetupCheck();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!isLoading && needsSetup) {
      // Small delay to prevent flash
      const timer = setTimeout(() => setShowSetup(true), 500);
      return () => clearTimeout(timer);
    }
  }, [needsSetup, isLoading]);

  const handleComplete = () => {
    setShowSetup(false);
  };

  return (
    <>
      {children}
      {showSetup && <MandatoryProfileSetup onComplete={handleComplete} />}
    </>
  );
}
