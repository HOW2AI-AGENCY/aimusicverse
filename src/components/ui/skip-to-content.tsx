/**
 * Skip to content link for keyboard navigation accessibility
 * Hidden until focused via keyboard (Tab key) or touch
 *
 * Mobile-optimized: positions below safe area and uses larger touch targets
 */
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function SkipToContent() {
  const isMobile = useIsMobile();

  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-[9999]",
        "focus:px-4 focus:py-2.5",
        isMobile
          ? "focus:top-16 focus:left-4 focus:text-sm"
          : "focus:top-4 focus:left-4 focus:text-base",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-lg focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "focus:min-h-touch focus:min-w-[100px]"
      )}
    >
      Перейти к содержимому
    </a>
  );
}
