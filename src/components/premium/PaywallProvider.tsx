/**
 * PaywallProvider - Global paywall state and trigger management
 * Wraps app to provide paywall context
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { SmartPaywallDialog } from './SmartPaywallDialog';
import { usePaywallTrigger, PaywallTriggerReason } from '@/hooks/usePaywallTrigger';

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
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
}

interface PaywallProviderProps {
  children: ReactNode;
}

export function PaywallProvider({ children }: PaywallProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentReason, setCurrentReason] = useState<PaywallTriggerReason>('soft_upsell');
  
  const {
    shouldShow: shouldAutoShow,
    reason: autoReason,
    generationCount,
    isFreeUser,
    markPaywallShown,
    isInCooldown,
  } = usePaywallTrigger();

  // Auto-show paywall based on triggers (with cooldown)
  useEffect(() => {
    if (shouldAutoShow && autoReason && !isInCooldown && !isOpen) {
      // Delay slightly to not interrupt user flow
      const timeout = setTimeout(() => {
        setCurrentReason(autoReason);
        setIsOpen(true);
      }, 2000);

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
