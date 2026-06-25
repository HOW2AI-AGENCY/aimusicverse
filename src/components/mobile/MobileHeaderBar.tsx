/**
 * MobileHeaderBar - Standardized mobile header with safe areas
 * Provides consistent navigation header across pages
 */

import { memo, ReactNode } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/button';
import { TELEGRAM_SAFE_AREA } from '@/constants/safe-area';

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
        "w-full z-sticky",
        sticky && "sticky top-0",
        !transparent &&
          "bg-background/70 backdrop-blur-xl backdrop-saturate-150 border-b border-border/40",
        className
      )}
      style={{
        paddingTop: sticky ? TELEGRAM_SAFE_AREA.stickyHeaderTop : '0.5rem',
      }}
    >
      <div className="flex items-center gap-2 px-3 pb-2.5 min-h-[52px]">
        {/* Leading */}
        <div className="flex items-center gap-1 shrink-0 w-10">
          {leading || (showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full hover:bg-muted/60 active:scale-95 transition-transform"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </Button>
          ))}
        </div>

        {/* Center — left-aligned title (native iOS large-title feel, compact) */}
        <div className="flex-1 min-w-0">
          {center || (
            <div className="min-w-0">
              {title && (
                <h1 className="font-display text-[17px] font-semibold tracking-tight truncate leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[12px] text-muted-foreground truncate leading-snug mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trailing */}
        <div className="flex items-center gap-1 shrink-0">
          {trailing || (showMore && onMore && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMore}
              className="h-10 w-10 rounded-full hover:bg-muted/60 active:scale-95 transition-transform"
              aria-label="Дополнительно"
            >
              <MoreVertical className="w-5 h-5" strokeWidth={2.2} />
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
});

export default MobileHeaderBar;
