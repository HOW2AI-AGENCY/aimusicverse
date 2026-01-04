/**
 * Minimal beta version footer
 * Displays version info at the bottom of every screen
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface BetaFooterProps {
  className?: string;
}

export const BetaFooter = memo(function BetaFooter({ className }: BetaFooterProps) {
  return (
    <footer 
      className={cn(
        'w-full py-3 text-center select-none pointer-events-none',
        className
      )}
    >
      <p className="text-[10px] tracking-wider text-muted-foreground/25 font-light">
        V0.1.0 · BETA · Создано HOW2AI.AGENCY © 2025
      </p>
    </footer>
  );
});
