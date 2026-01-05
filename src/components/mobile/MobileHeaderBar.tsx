/**
 * MobileHeaderBar - Standardized mobile header with safe areas
 * Provides consistent navigation header across pages
 */

import { memo, ReactNode } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/button';

interface MobileHeaderBarProps {
  /** Header title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Back button handler */
  onBack?: () => void;
  /** More actions handler */
  onMore?: () => void;
  /** Leading custom element */
  leading?: ReactNode;
  /** Trailing custom element */
  trailing?: ReactNode;
  /** Center custom content (replaces title) */
  center?: ReactNode;
  /** Show back button */
  showBack?: boolean;
  /** Show more button */
  showMore?: boolean;
  /** Sticky header */
  sticky?: boolean;
  /** Transparent background */
  transparent?: boolean;
  /** Additional className */
  className?: string;
}

export const MobileHeaderBar = memo(function MobileHeaderBar({
  title,
  subtitle,
  onBack,
  onMore,
  leading,
  trailing,
  center,
  showBack = true,
  showMore = false,
  sticky = true,
  transparent = false,
  className,
}: MobileHeaderBarProps) {
  const { patterns } = useHaptic();

  const handleBack = () => {
    if (!onBack) return;
    patterns.tap();
    onBack();
  };

  const handleMore = () => {
    if (!onMore) return;
    patterns.select();
    onMore();
  };

  return (
    <header
      className={cn(
        "w-full z-40",
        sticky && "sticky top-0",
        !transparent && "bg-background/95 backdrop-blur-md border-b border-border/40",
        className
      )}
      style={{
        paddingTop: sticky ? 'max(0.75rem, env(safe-area-inset-top))' : '0.75rem',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-3 min-h-[44px]">
        {/* Leading */}
        <div className="flex items-center gap-2 shrink-0">
          {leading || (showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ))}
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0 text-center">
          {center || (
            <div className="px-2">
              {title && (
                <h1 className="text-base font-semibold truncate leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trailing */}
        <div className="flex items-center gap-2 shrink-0">
          {trailing || (showMore && onMore && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMore}
              className="h-9 w-9"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
});

export default MobileHeaderBar;
