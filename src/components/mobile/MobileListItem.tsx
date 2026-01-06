/**
 * MobileListItem - Standardized mobile list item with touch targets
 * Provides consistent UX across all list interfaces
 */

import { memo, ReactNode, forwardRef } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/button';

interface MobileListItemProps {
  /** Main title text */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Leading icon or thumbnail */
  leading?: ReactNode;
  /** Trailing element (badge, time, etc) */
  trailing?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** More actions handler */
  onMoreClick?: (e: React.MouseEvent) => void;
  /** Show chevron indicator */
  showChevron?: boolean;
  /** Show more button */
  showMore?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Active/selected state */
  active?: boolean;
  /** Additional className */
  className?: string;
  /** Children for expandable content */
  children?: ReactNode;
}

export const MobileListItem = memo(forwardRef<HTMLDivElement, MobileListItemProps>(
  function MobileListItem({
    title,
    subtitle,
    leading,
    trailing,
    onClick,
    onMoreClick,
    showChevron = true,
    showMore = false,
    disabled = false,
    active = false,
    className,
    children,
  }, ref) {
    const { patterns } = useHaptic();

    const handleClick = () => {
      if (disabled || !onClick) return;
      patterns.tap();
      onClick();
    };

    const handleMoreClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || !onMoreClick) return;
      patterns.select();
      onMoreClick(e);
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div
          onClick={handleClick}
          className={cn(
            "flex items-center gap-3 p-3 min-h-[56px]",
            "transition-all duration-200 touch-manipulation",
            onClick && !disabled && [
              "cursor-pointer active:scale-[0.98]",
              "hover:bg-accent/50 active:bg-accent"
            ],
            active && "bg-accent/70",
            disabled && "opacity-50 cursor-not-allowed",
            !children && "rounded-lg"
          )}
        >
          {/* Leading */}
          {leading && (
            <div className="shrink-0">
              {leading}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 py-1">
            <p className={cn(
              "text-sm font-medium truncate leading-tight",
              active && "text-primary"
            )}>
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Trailing */}
          {trailing && (
            <div className="shrink-0 flex items-center gap-2">
              {trailing}
            </div>
          )}

          {/* More Button */}
          {showMore && onMoreClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMoreClick}
              disabled={disabled}
              className="h-9 w-9 shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}

          {/* Chevron */}
          {showChevron && onClick && !showMore && (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </div>

        {/* Expandable children */}
        {children && (
          <div className="px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    );
  }
));

export default MobileListItem;
