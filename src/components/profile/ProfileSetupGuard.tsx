import { useState, useEffect } from 'react';
import { useProfileSetupCheck } from '@/hooks/useProfileSetupCheck';
import { EnhancedProfileSetup } from './setup/EnhancedProfileSetup';

interface ProfileSetupGuardProps {
  children: React.ReactNode;
}

export function ProfileSetupGuard({ children }: ProfileSetupGuardProps) {
  const { needsSetup, isLoading } = useProfileSetupCheck();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (needsSetup) {
        // Small delay to prevent flash
        const timer = setTimeout(() => setShowSetup(true), 500);
        return () => clearTimeout(timer);
      } else {
        // Hide setup when profile is configured
        setShowSetup(false);
      }
    }
  }, [needsSetup, isLoading]);

  const handleComplete = () => {
    setShowSetup(false);
  };

  return (
    <>
      {children}
      {showSetup && <EnhancedProfileSetup onComplete={handleComplete} />}
    </>
  );
}
