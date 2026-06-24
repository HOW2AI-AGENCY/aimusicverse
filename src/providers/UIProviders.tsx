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
import { HintRegistryProvider } from '@/components/hints';

interface UIProvidersProps {
  children: ReactNode;
}

/**
 * UI providers for tooltips, hints and toast notifications.
 *
 * HintRegistryProvider guarantees only one contextual hint card is visible
 * at a time across the whole app, regardless of which page mounts an
 * overlay. It also tracks seen-state in a single storage key and detects
 * open modals/sheets to avoid stacking.
 */
export const UIProviders = memo(function UIProviders({ children }: UIProvidersProps) {
  return (
    <TooltipProvider>
      <Sonner />
      <InteractiveTooltipProvider>
        <HintRegistryProvider>{children}</HintRegistryProvider>
      </InteractiveTooltipProvider>
    </TooltipProvider>
  );
});
