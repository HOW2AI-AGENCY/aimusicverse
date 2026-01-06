/**
 * UnifiedActionBar - Horizontal Action Bar Component
 * 
 * Variants:
 * - scroll: Horizontal scrollable with indicator
 * - grid: Button grid layout
 * - segment: Segmented control style
 */

import React, { memo, useRef, useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { touchTarget } from '@/lib/touch-target';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptic } from '@/hooks/useHaptic';

export interface ActionBarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'destructive' | 'outline';
  badge?: string | number;
}

export interface UnifiedActionBarProps {
  variant?: 'scroll' | 'grid' | 'segment';
  actions: ActionBarItem[];
  size?: 'sm' | 'md' | 'lg';
  showScrollIndicator?: boolean;
  showLabels?: boolean;
  className?: string;
}

export const UnifiedActionBar = memo(function UnifiedActionBar({
  variant = 'scroll',
  actions,
  size = 'md',
  showScrollIndicator = true,
  showLabels = true,
  className,
}: UnifiedActionBarProps) {
  const isMobile = useIsMobile();
  const { impact } = useHaptic();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);

  // Check scroll position for fade indicators
  useEffect(() => {
    if (variant !== 'scroll' || !showScrollIndicator) return;

    const container = scrollRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [variant, showScrollIndicator, actions]);

  const handleClick = (action: ActionBarItem) => {
    if (action.disabled || action.loading) return;
    impact('light');
    action.onClick();
  };

  const sizeClasses = {
    sm: isMobile ? 'h-8 px-2 text-xs gap-1' : 'h-7 px-2 text-xs gap-1',
    md: isMobile ? 'h-10 px-3 text-sm gap-1.5' : 'h-9 px-3 text-sm gap-1.5',
    lg: isMobile ? 'h-12 px-4 text-base gap-2' : 'h-10 px-4 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Segment variant
  if (variant === 'segment') {
    return (
      <div className={cn(
        'inline-flex rounded-lg bg-muted p-1',
        className
      )}>
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleClick(action)}
              disabled={action.disabled || action.loading}
              className={cn(
                'flex items-center justify-center rounded-md transition-all',
                sizeClasses[size],
                action.active 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground',
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={iconSizes[size]} />
              {showLabels && <span>{action.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Grid variant
  if (variant === 'grid') {
    const columns = actions.length <= 4 ? actions.length : Math.min(4, Math.ceil(actions.length / 2));
    return (
      <div 
        className={cn(
          'grid gap-2',
          className
        )}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant === 'primary' ? 'default' : action.variant || 'outline'}
              onClick={() => handleClick(action)}
              disabled={action.disabled || action.loading}
              className={cn(
                sizeClasses[size],
                'relative',
                action.active && 'ring-2 ring-primary'
              )}
            >
              <Icon className={iconSizes[size]} />
              {showLabels && <span className="truncate">{action.label}</span>}
              {action.badge && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {action.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  // Scroll variant (default)
  return (
    <div className={cn('relative', className)}>
      {/* Left fade indicator */}
      {showScrollIndicator && showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      )}

      {/* Right fade indicator */}
      {showScrollIndicator && showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {actions.map(action => {
          const Icon = action.icon;
          const buttonVariant = action.variant === 'primary' 
            ? 'default' 
            : action.variant || 'outline';

          return (
            <Button
              key={action.id}
              variant={buttonVariant}
              onClick={() => handleClick(action)}
              disabled={action.disabled || action.loading}
              className={cn(
                'shrink-0 relative',
                sizeClasses[size],
                isMobile && touchTarget.small,
                action.active && 'ring-2 ring-primary'
              )}
            >
              <Icon className={iconSizes[size]} />
              {showLabels && <span className="whitespace-nowrap">{action.label}</span>}
              {action.badge && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {action.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
