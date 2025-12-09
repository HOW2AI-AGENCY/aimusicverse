import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useInteractiveTooltips, TooltipDefinition } from '@/hooks/useInteractiveTooltips';

interface TooltipContextValue {
  activeTooltipId: string | null;
  isNewUser: boolean;
  markAsSeen: (id: string) => void;
  showTooltip: (id: string) => void;
  dismissAndShowNext: () => void;
  shouldShowTooltip: (id: string) => boolean;
  getTooltipConfig: (id: string) => TooltipDefinition | undefined;
  getAvailableTooltips: () => TooltipDefinition[];
  resetAllTooltips: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const tooltips = useInteractiveTooltips(location.pathname);

  return (
    <TooltipContext.Provider value={tooltips}>
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltips() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltips must be used within a TooltipProvider');
  }
  return context;
}
