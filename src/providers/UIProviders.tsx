/**
 * UIProviders - Consolidated UI-related providers
 * 
 * Combines UI providers that handle tooltips and toasts:
 * - TooltipProvider (Radix)
 * - InteractiveTooltipProvider (Custom)
 * - Sonner (Toast notifications)
 * 
 * These are lightweight and always needed for the UI.
 */

import { ReactNode, memo } from 'react';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TooltipProvider as InteractiveTooltipProvider } from '@/components/tooltips';

interface UIProvidersProps {
  children: ReactNode;
}

/**
 * UI providers for tooltips and toast notifications
 */
export const UIProviders = memo(function UIProviders({ children }: UIProvidersProps) {
  return (
    <TooltipProvider>
      <Sonner />
      <InteractiveTooltipProvider>
        {children}
      </InteractiveTooltipProvider>
    </TooltipProvider>
  );
});
