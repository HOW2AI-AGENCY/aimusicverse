/**
 * PageContainer - Universal page wrapper with automatic safe areas
 * Simplifies creating new pages with consistent layout and Telegram support
 * 
 * @example
 * ```tsx
 * // Standard page with bottom nav
 * <PageContainer>
 *   <YourContent />
 * </PageContainer>
 * 
 * // Fullscreen page without nav
 * <PageContainer variant="fullscreen">
 *   <FullscreenContent />
 * </PageContainer>
 * 
 * // Page with custom header
 * <PageContainer 
 *   header={<PageHeader title="Settings" onBack={() => navigate(-1)} />}
 * >
 *   <SettingsContent />
 * </PageContainer>
 * ```
 */

import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { TELEGRAM_SAFE_AREA, getSafeAreaTop, getSafeAreaBottom } from '@/constants/safe-area';

export type PageVariant = 
  | 'default'      // Standard page with bottom nav
  | 'fullscreen'   // Full viewport, no nav
  | 'modal'        // Modal-like page (e.g., player)
  | 'overlay';     // Fixed overlay

export type PagePadding = 'none' | 'sm' | 'md' | 'lg';

interface PageContainerProps {
  children: ReactNode;
  /** Page variant determines safe area handling */
  variant?: PageVariant;
  /** Include bottom navigation spacing (80px) */
  withBottomNav?: boolean;
  /** Include sticky header spacing */
  withStickyHeader?: boolean;
  /** Custom header component */
  header?: ReactNode;
  /** Footer component (positioned above bottom nav) */
  footer?: ReactNode;
  /** Horizontal content padding */
  padding?: PagePadding;
  /** Additional className */
  className?: string;
  /** Content area className */
  contentClassName?: string;
  /** Style overrides */
  style?: CSSProperties;
  /** Extra top padding in pixels */
  extraTop?: number;
  /** Extra bottom padding in pixels */
  extraBottom?: number;
}

const paddingMap: Record<PagePadding, string> = {
  none: '',
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6',
};

/**
 * Universal page container with automatic Telegram Mini App safe areas
 */
export function PageContainer({
  children,
  variant = 'default',
  withBottomNav = true,
  withStickyHeader = false,
  header,
  footer,
  padding = 'md',
  className,
  contentClassName,
  style,
  extraTop = 0,
  extraBottom = 0,
}: PageContainerProps) {
  // Calculate safe area styles based on variant
  const getContainerStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = { ...style };

    switch (variant) {
      case 'fullscreen':
        return {
          ...baseStyle,
          paddingTop: getSafeAreaTop(extraTop),
          paddingBottom: getSafeAreaBottom(extraBottom),
          minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        };

      case 'modal':
        return {
          ...baseStyle,
          paddingTop: getSafeAreaTop(extraTop + 8),
          paddingBottom: getSafeAreaBottom(extraBottom + 16),
          minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        };

      case 'overlay':
        return {
          ...baseStyle,
          paddingTop: TELEGRAM_SAFE_AREA.minimalTop,
          paddingBottom: TELEGRAM_SAFE_AREA.bottom,
        };

      case 'default':
      default:
        // Standard page with optional header and bottom nav
        const bottomNavHeight = withBottomNav ? 80 : 0;
        return {
          ...baseStyle,
          // Only add top padding if no header (header handles its own safe area)
          paddingTop: header ? undefined : getSafeAreaTop(extraTop + 12),
          paddingBottom: getSafeAreaBottom(bottomNavHeight + extraBottom),
          minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        };
    }
  };

  const containerClasses = cn(
    'tg-safe-container flex flex-col',
    paddingMap[padding],
    variant === 'fullscreen' && 'overflow-hidden',
    variant === 'overlay' && 'fixed inset-0 z-50',
    className
  );

  const contentClasses = cn(
    'flex-1',
    contentClassName
  );

  return (
    <div className={containerClasses} style={getContainerStyle()}>
      {header}
      <main className={contentClasses}>
        {children}
      </main>
      {footer}
    </div>
  );
}

/**
 * PageHeader - Sticky header with safe area support
 */
interface PageHeaderProps {
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Transparent background */
  transparent?: boolean;
  /** Blur background */
  blur?: boolean;
  /** Show border */
  bordered?: boolean;
}

export function PageHeader({
  children,
  className,
  transparent = false,
  blur = true,
  bordered = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        !transparent && 'bg-background/95',
        blur && 'backdrop-blur-md',
        bordered && 'border-b border-border/40',
        className
      )}
      style={{
        paddingTop: TELEGRAM_SAFE_AREA.stickyHeaderTop,
      }}
    >
      {children}
    </header>
  );
}

/**
 * PageContent - Scrollable content area
 */
interface PageContentProps {
  children: ReactNode;
  className?: string;
  /** Disable scroll */
  noScroll?: boolean;
}

export function PageContent({
  children,
  className,
  noScroll = false,
}: PageContentProps) {
  return (
    <div
      className={cn(
        'flex-1',
        !noScroll && 'overflow-y-auto',
        noScroll && 'overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageSection - Section within page content
 */
interface PageSectionProps {
  children: ReactNode;
  className?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Right-aligned action */
  action?: ReactNode;
  /** Spacing variant */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const sectionSpacing: Record<string, string> = {
  none: '',
  sm: 'py-3',
  md: 'py-4',
  lg: 'py-6',
};

export function PageSection({
  children,
  className,
  title,
  subtitle,
  action,
  spacing = 'md',
}: PageSectionProps) {
  return (
    <section className={cn(sectionSpacing[spacing], className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h2 className="text-lg font-semibold">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export default PageContainer;
