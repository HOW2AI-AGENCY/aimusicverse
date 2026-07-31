import { ReactNode, memo } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/contexts/GuestModeContext";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Check if we're in a development/preview environment
 * In dev environments, we auto-enable guest mode so previews work seamlessly
 */
const isDevEnvironment = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  const hasTelegramWebApp = !!window.Telegram?.WebApp?.initData;

  const isLovableDomain =
    hostname.includes("lovable.dev") || hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const hasDevParam = window.location.search.includes("dev=1");

  return (isLovableDomain || isLocalhost || hasDevParam) && !hasTelegramWebApp;
};

/**
 * ProtectedRoute - Guards routes requiring authentication
 * Uses unified PageSkeleton to prevent layout shifts during loading
 */
export const ProtectedRoute = memo(function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isTelegramAuthPending } = useAuth();
  const { isGuestMode } = useGuestMode();
  const location = useLocation();

  // In dev environment, always allow access (guest mode is auto-enabled)
  const isDevMode = isDevEnvironment();

  // Use PageSkeleton for consistent loading state - matches MainLayout structure
  // `isTelegramAuthPending` covers the window where getSession() already resolved
  // as anonymous but the Telegram initData handshake is still landing a session:
  // redirecting here would drop the session and the deep-link target.
  if ((loading || isTelegramAuthPending) && !isDevMode) {
    return <PageSkeleton variant="default" />;
  }

  // Allow access if: authenticated, guest mode, or dev environment
  if (!isAuthenticated && !isGuestMode && !isDevMode) {
    // Preserve where the user was heading so /auth can return them after login.
    return <Navigate to="/auth" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
});

