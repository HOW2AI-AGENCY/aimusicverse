import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export function useProfileSetupCheck() {
  const { user, loading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  // Check if profile needs setup:
  // - Missing first_name or display_name
  // - Bio not filled (at least 20 chars for meaningful bio)
  // - Profile completeness below threshold (40%)
  const needsSetup = !isAuthLoading && !isProfileLoading && user && profile && (
    !profile.first_name || 
    profile.first_name.trim() === '' ||
    profile.is_public === null ||
    (profile as any).profile_completeness < 40
  );

  return {
    needsSetup,
    isLoading: isAuthLoading || isProfileLoading,
    profile,
    user,
    completeness: (profile as any)?.profile_completeness ?? 0,
  };
}
