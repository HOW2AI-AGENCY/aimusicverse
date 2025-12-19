import { useState, useEffect, useCallback } from 'react';
import { useProfileSetupCheck } from '@/hooks/useProfileSetupCheck';
import { EnhancedProfileSetup } from './setup/EnhancedProfileSetup';

interface ProfileSetupGuardProps {
  children: React.ReactNode;
}

// Key to track if user has dismissed setup this session
const SETUP_DISMISSED_KEY = 'profile_setup_dismissed';

export function ProfileSetupGuard({ children }: ProfileSetupGuardProps) {
  const { needsSetup, isLoading } = useProfileSetupCheck();
  const [showSetup, setShowSetup] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    // Check if already dismissed this session
    try {
      return sessionStorage.getItem(SETUP_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Don't show if dismissed or still loading
    if (dismissed || isLoading) {
      return;
    }
    
    if (needsSetup) {
      // Small delay to prevent flash, but not too long
      const timer = setTimeout(() => setShowSetup(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowSetup(false);
    }
  }, [needsSetup, isLoading, dismissed]);

  const handleComplete = useCallback(() => {
    setShowSetup(false);
    // Clear the dismissed flag when properly completed
    try {
      sessionStorage.removeItem(SETUP_DISMISSED_KEY);
    } catch {}
  }, []);

  const handleDismiss = useCallback(() => {
    setShowSetup(false);
    setDismissed(true);
    // Remember dismissal for this session
    try {
      sessionStorage.setItem(SETUP_DISMISSED_KEY, 'true');
    } catch {}
  }, []);

  return (
    <>
      {children}
      {showSetup && (
        <EnhancedProfileSetup 
          onComplete={handleComplete}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
