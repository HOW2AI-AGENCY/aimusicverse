import { useGuestMode } from '@/contexts/GuestModeContext';
import { useAuth } from '@/hooks/useAuth';
import { notify } from '@/lib/notifications';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to manage feature access in guest mode
 */
export const useGuestAccess = () => {
  const { isGuestMode } = useGuestMode();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * Check if a feature requires authentication
   * Shows a toast and returns false if user needs to authenticate
   */
  const requireAuth = (action: string = 'эта функция'): boolean => {
    if (isGuestMode || !isAuthenticated) {
      notify.info(`Войдите, чтобы использовать ${action}`, {
        dedupe: true,
        dedupeKey: 'require-auth',
        dedupeTimeout: 3000,
        action: {
          label: 'Войти',
          onClick: () => navigate('/auth'),
        },
      });
      return false;
    }
    return true;
  };

  /**
   * Returns true if feature should be read-only
   */
  const isReadOnly = (): boolean => {
    return isGuestMode || !isAuthenticated;
  };

  /**
   * Returns true if user can perform write operations
   */
  const canWrite = (): boolean => {
    return isAuthenticated && !isGuestMode;
  };

  return {
    isGuestMode,
    isAuthenticated,
    requireAuth,
    isReadOnly,
    canWrite,
  };
};
