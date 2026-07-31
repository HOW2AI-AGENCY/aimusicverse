import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/contexts/GuestModeContext";

/**
 * Shared auth gate used by page-level guards.
 *
 * Page guards used to check only `isAuthenticated`, which produced two bugs:
 *  - inside a real Telegram Mini App the page bounced to /auth while the
 *    `initData` handshake was still landing the session (session lost);
 *  - in dev/preview and guest mode the page bounced even though ProtectedRoute
 *    intentionally lets those visitors in.
 *
 * Keep this in sync with `ProtectedRoute`.
 */
export const isPreviewEnvironment = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  const hasTelegramWebApp = !!window.Telegram?.WebApp?.initData;

  const isLovableDomain =
    hostname.includes("lovable.dev") || hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const hasDevParam = window.location.search.includes("dev=1");

  return (isLovableDomain || isLocalhost || hasDevParam) && !hasTelegramWebApp;
};

export interface AuthGate {
  /** Auth is still settling — render a loader, never a redirect. */
  isResolving: boolean;
  /** Visitor may see the page (authenticated, guest mode, or dev preview). */
  canAccess: boolean;
}

export function useAuthGate(): AuthGate {
  const { isAuthenticated, loading, isTelegramAuthPending } = useAuth();
  const { isGuestMode } = useGuestMode();
  const isPreview = isPreviewEnvironment();

  return {
    isResolving: (loading || isTelegramAuthPending) && !isPreview,
    canAccess: isAuthenticated || isGuestMode || isPreview,
  };
}
