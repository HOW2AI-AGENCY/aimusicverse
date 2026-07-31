/* eslint-disable react-refresh/only-export-components */
/**
 * PaywallProvider - Global paywall state and trigger management
 * Wraps app to provide paywall context
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { SmartPaywallDialog } from "./SmartPaywallDialog";
import { usePaywallTrigger, PaywallTriggerReason } from "@/hooks/usePaywallTrigger";

interface PaywallContextValue {
  showPaywall: (reason: PaywallTriggerReason) => void;
  hidePaywall: () => void;
  isPaywallOpen: boolean;
  isFreeUser: boolean;
  generationCount: number;
}

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error("usePaywall must be used within PaywallProvider");
  }
  return context;
}

// Session-level guard: only auto-show once per browser session
const SESSION_KEY = "paywall_shown_this_session";

// Routes where the paywall must never auto-open — entry / browsing surfaces
// where an unsolicited bottom sheet over the feed is a regression. Explicit
// `showPaywall(reason)` calls still work everywhere.
//
// NOTE: PaywallProvider sits ABOVE <Router> in the provider tree, so we cannot
// use `useLocation()` here. The auto-show effect only fires once per session
// (sessionStorage guard), so reading `window.location.pathname` synchronously
// inside the effect is sufficient.
const PAYWALL_AUTO_SHOW_DENYLIST = new Set(["/", "/index", "/auth", "/onboarding", "/library", "/community"]);

interface PaywallProviderProps {
  children: ReactNode;
}

export function PaywallProvider({ children }: PaywallProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentReason, setCurrentReason] = useState<PaywallTriggerReason>("soft_upsell");
  const hasAutoShownRef = useRef(false);

  const {
    shouldShow: shouldAutoShow,
    reason: autoReason,
    generationCount,
    isFreeUser,
    markPaywallShown,
    isInCooldown,
  } = usePaywallTrigger();

  // Auto-show paywall based on triggers (with cooldown + session guard)
  useEffect(() => {
    // Don't auto-show if already shown this session or this component lifecycle
    const shownThisSession = sessionStorage.getItem(SESSION_KEY) === "true";
    if (shownThisSession || hasAutoShownRef.current) return;

    if (shouldAutoShow && autoReason && !isInCooldown && !isOpen) {
      // Longer delay (8s) to let user engage with content first
      const timeout = setTimeout(() => {
        // Re-check route at fire time: user may have navigated since effect
        // was scheduled. Skip auto-show on entry / browsing surfaces.
        if (typeof window !== "undefined" && PAYWALL_AUTO_SHOW_DENYLIST.has(window.location.pathname)) {
          return;
        }
        hasAutoShownRef.current = true;
        sessionStorage.setItem(SESSION_KEY, "true");
        setCurrentReason(autoReason);
        setIsOpen(true);
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [shouldAutoShow, autoReason, isInCooldown, isOpen]);

  const showPaywall = useCallback((reason: PaywallTriggerReason) => {
    setCurrentReason(reason);
    setIsOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handlePaywallShown = useCallback(() => {
    markPaywallShown();
  }, [markPaywallShown]);

  const value: PaywallContextValue = {
    showPaywall,
    hidePaywall,
    isPaywallOpen: isOpen,
    isFreeUser,
    generationCount,
  };

  return (
    <PaywallContext.Provider value={value}>
      {children}

      <SmartPaywallDialog
        open={isOpen}
        onClose={hidePaywall}
        reason={currentReason}
        generationCount={generationCount}
        onPaywallShown={handlePaywallShown}
      />
    </PaywallContext.Provider>
  );
}
