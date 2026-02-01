import { ReactNode, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Check if we're in a development/preview environment
 * In dev environments, we auto-enable guest mode so previews work seamlessly
 */
const isDevEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const hasTelegramWebApp = !!window.Telegram?.WebApp?.initData;
  
  const isLovableDomain = hostname.includes('lovable.dev') ||
                          hostname.includes('lovable.app') ||
                          hostname.includes('lovableproject.com');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const hasDevParam = window.location.search.includes('dev=1');
  
  return (isLovableDomain || isLocalhost || hasDevParam) && !hasTelegramWebApp;
};

/**
 * ProtectedRoute - Guards routes requiring authentication
 * Uses unified PageSkeleton to prevent layout shifts during loading
 */
export const ProtectedRoute = memo(function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const { isGuestMode } = useGuestMode();
  
  // In dev environment, always allow access (guest mode is auto-enabled)
  const isDevMode = isDevEnvironment();

  // Use PageSkeleton for consistent loading state - matches MainLayout structure
  if (loading && !isDevMode) {
    return <PageSkeleton variant="default" />;
  }

  // Allow access if: authenticated, guest mode, or dev environment
  if (!isAuthenticated && !isGuestMode && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
});
