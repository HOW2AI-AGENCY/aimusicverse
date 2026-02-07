/**
 * SafeLayout - Universal layout container for Telegram Mini App
 * Handles all safe area insets automatically
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTelegramSafeArea, safeAreaClasses } from '@/hooks/useTelegramSafeArea';

interface SafeLayoutProps {
  children: ReactNode;
  /** Include padding for BottomNavigation (80px) */
  withBottomNav?: boolean;
  /** Include padding for Telegram MainButton */
  withMainButton?: boolean;
  /** Apply top safe area (for pages without sticky header) */
  withTopSafeArea?: boolean;
  /** Apply horizontal safe areas (for landscape mode on notch devices) */
  withHorizontalSafeArea?: boolean;
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
 * // Fullscreen page with all safe areas
 * <SafeLayout withTopSafeArea withHorizontalSafeArea withMainButton={false} withBottomNav={false}>
 *   <FullscreenContent />
 * </SafeLayout>
 * ```
 */
export function SafeLayout({
  children,
  withBottomNav = true,
  withMainButton = true,
  withTopSafeArea = false,
  withHorizontalSafeArea = false,
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
      className={cn(
        'tg-safe-container',
        withHorizontalSafeArea && safeAreaClasses.safeHorizontal,
        className
      )}
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
  /** Include horizontal safe areas */
  withHorizontalSafeArea?: boolean;
}

export function SafeHeader({ 
  children, 
  className, 
  extraPadding = 0.5,
  withHorizontalSafeArea = false,
}: SafeHeaderProps) {
  const extraPx = extraPadding * 16; // Convert rem to px for calc
  
  return (
    <div
      className={cn(
        'sticky top-0 z-40',
        withHorizontalSafeArea && safeAreaClasses.safeHorizontal,
        className
      )}
      style={{
        paddingTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 44px), env(safe-area-inset-top, 44px)) + ${extraPx}px)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * SafeBottom - Fixed bottom component with proper safe area
 */
interface SafeBottomProps {
  children: ReactNode;
  className?: string;
  /** Include BottomNav space */
  withBottomNav?: boolean;
  /** Extra padding above safe area in pixels */
  extraPadding?: number;
}

export function SafeBottom({
  children,
  className,
  withBottomNav = false,
  extraPadding = 0,
}: SafeBottomProps) {
  const extraStr = extraPadding > 0 ? ` + ${extraPadding}px` : '';
  const navExtra = withBottomNav ? ' + 80px' : '';
  
  return (
    <div
      className={cn('fixed bottom-0 left-0 right-0 z-40', className)}
      style={{
        paddingBottom: `calc(max(var(--tg-safe-area-inset-bottom, 34px), env(safe-area-inset-bottom, 34px))${navExtra}${extraStr})`,
      }}
    >
      {children}
    </div>
  );
}
