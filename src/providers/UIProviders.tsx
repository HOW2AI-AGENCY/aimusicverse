/**
 * UIProviders - Consolidated UI-related providers.
 *
 * - TooltipProvider (Radix, for hover/focus micro-tooltips)
 * - HintRegistryProvider (unified contextual hints / onboarding tips)
 * - Sonner (Toast notifications)
 */

import { ReactNode, memo } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HintRegistryProvider } from "@/components/hints";

interface UIProvidersProps {
  children: ReactNode;
}

/**
 * HintRegistryProvider guarantees only one contextual hint card is visible
 * at a time across the whole app, regardless of which page mounts an
 * overlay. It also tracks seen-state in a single storage key and detects
 * open modals/sheets to avoid stacking.
 */
export const UIProviders = memo(function UIProviders({ children }: UIProvidersProps) {
  return (
    <TooltipProvider>
      <Sonner />
      <HintRegistryProvider>{children}</HintRegistryProvider>
    </TooltipProvider>
  );
});
