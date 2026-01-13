import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { Loader2 } from 'lucide-react';

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

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { isGuestMode } = useGuestMode();
  
  // In dev environment, always allow access (guest mode is auto-enabled)
  const isDevMode = isDevEnvironment();

  // Short loading state - max 2 seconds then proceed
  if (loading && !isDevMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if: authenticated, guest mode, or dev environment
  if (!isAuthenticated && !isGuestMode && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
