/**
 * CreditBalanceIndicator - Compact always-visible credit balance display
 * Shows current balance and cost for generation
 */

import { memo } from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditBalanceIndicatorProps {
  balance: number;
  cost: number;
  className?: string;
}

export const CreditBalanceIndicator = memo(function CreditBalanceIndicator({
  balance,
  cost,
  className,
}: CreditBalanceIndicatorProps) {
  const isLow = balance < cost * 3;
  const isInsufficient = balance < cost;
  const remaining = balance - cost;
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
        "border transition-colors",
        isInsufficient 
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : isLow
            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            : "bg-muted/50 border-border/50 text-muted-foreground",
        className
      )}
    >
      <Coins className="w-3.5 h-3.5" />
      <span className="font-medium tabular-nums">{balance}</span>
      <span className="opacity-60">•</span>
      <span className="opacity-70">−{cost}</span>
      {!isInsufficient && (
        <>
          <span className="opacity-60">=</span>
          <span className={cn(
            "font-semibold tabular-nums",
            isLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          )}>
            {remaining}
          </span>
        </>
      )}
    </div>
  );
});
