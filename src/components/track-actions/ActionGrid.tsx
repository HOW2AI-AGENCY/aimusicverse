/**
 * ActionGrid - Flat action grid with visual separators
 * Replaces CollapsibleSection with a minimalist flat structure
 */

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const ActionGroup = memo(function ActionGroup({
  title,
  children,
  className,
}: ActionGroupProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <div className="flex items-center gap-2 px-1 py-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>
      )}
      <div className="grid grid-cols-4 gap-1">
        {children}
      </div>
    </div>
  );
});

interface ActionDividerProps {
  className?: string;
}

export const ActionDivider = memo(function ActionDivider({ className }: ActionDividerProps) {
  return <div className={cn("h-px bg-border/30 mx-2 my-1.5", className)} />;
});

interface ActionGridContainerProps {
  children: ReactNode;
  className?: string;
}

export const ActionGridContainer = memo(function ActionGridContainer({
  children,
  className,
}: ActionGridContainerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
});
