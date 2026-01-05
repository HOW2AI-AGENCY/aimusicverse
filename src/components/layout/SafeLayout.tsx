/**
 * SafeLayout - Universal layout container for Telegram Mini App
 * Handles all safe area insets automatically
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTelegramSafeArea } from '@/hooks/useTelegramSafeArea';

interface SafeLayoutProps {
  children: ReactNode;
  /** Include padding for BottomNavigation (80px) */
  withBottomNav?: boolean;
  /** Include padding for Telegram MainButton */
  withMainButton?: boolean;
  /** Apply top safe area (for pages without sticky header) */
  withTopSafeArea?: boolean;
  /** Additional className */
  className?: string;
  /** Extra top padding in pixels */
  extraTop?: number;
  /** Extra bottom padding in pixels */
  extraBottom?: number;
}

/**
 * Universal layout container that handles Telegram Mini App safe areas
 * 
 * @example
 * ```tsx
 * // Page with BottomNav
 * <SafeLayout withBottomNav>
 *   <Content />
 * </SafeLayout>
 * 
 * // Page without BottomNav but with MainButton
 * <SafeLayout withMainButton>
 *   <Content />
 * </SafeLayout>
 * 
 * // Fullscreen page
 * <SafeLayout withTopSafeArea withMainButton={false} withBottomNav={false}>
 *   <FullscreenContent />
 * </SafeLayout>
 * ```
 */
export function SafeLayout({
  children,
  withBottomNav = true,
  withMainButton = true,
  withTopSafeArea = false,
  className,
  extraTop = 0,
  extraBottom = 0,
}: SafeLayoutProps) {
  const safeAreaStyles = useTelegramSafeArea({
    withBottomNav,
    withMainButton,
    extraTop: withTopSafeArea ? extraTop : 0,
    extraBottom,
  });

  return (
    <div
      className={cn('tg-safe-container', className)}
      style={{
        paddingTop: withTopSafeArea ? safeAreaStyles.paddingTop : undefined,
        paddingBottom: safeAreaStyles.paddingBottom,
        minHeight: safeAreaStyles.minHeight,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

/**
 * SafeHeader - Header component with proper top safe area
 */
interface SafeHeaderProps {
  children: ReactNode;
  className?: string;
  /** Extra padding below safe area in rem */
  extraPadding?: number;
}

export function SafeHeader({ children, className, extraPadding = 0.5 }: SafeHeaderProps) {
  const extraPx = extraPadding * 16; // Convert rem to px for calc
  
  return (
    <div
      className={cn('sticky top-0 z-40', className)}
      style={{
        paddingTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 44px), env(safe-area-inset-top, 44px)) + ${extraPx}px)`,
      }}
    >
      {children}
    </div>
  );
}
