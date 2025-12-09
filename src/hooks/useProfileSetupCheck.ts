import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export function useProfileSetupCheck() {
  const { user, loading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  const needsSetup = !isAuthLoading && !isProfileLoading && user && profile && (
    !profile.first_name || 
    profile.first_name.trim() === '' ||
    profile.is_public === null
  );

  return {
    needsSetup,
    isLoading: isAuthLoading || isProfileLoading,
    profile,
    user,
  };
}
