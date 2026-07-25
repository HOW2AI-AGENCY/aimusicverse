/**
 * AppHeader — 3-zone header for all pages.
 *
 * Layout:
 *   Zone 1 (navSlot) | Zone 2 (title/breadcrumbs/logo) | Zone 3 (rightAction)
 *
 * Mobile:  3-column grid (auto / 1fr / auto), all zones always visible.
 * Desktop: same grid, title centered naturally in Zone 2.
 *
 * Accounts for Telegram safe area and native buttons.
 */

import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import { AppLogo } from "@/components/branding/AppLogo";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Zone 1: nav/back button, always visible (was leftAction) */
  navSlot?: React.ReactNode;
  /** Zone 3: actions menu, always visible */
  rightAction?: React.ReactNode;
  /** Custom title element to replace the default title text */
  titleElement?: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  /** Breadcrumb items for nested navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Whether to show auto-generated breadcrumbs based on route */
  showBreadcrumbs?: boolean;

  // backward compat — deprecated, use navSlot
  /** backward compat — deprecated, use navSlot */
  leftAction?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  icon,
  navSlot,
  rightAction,
  titleElement,
  className,
  showLogo = false,
  breadcrumbs,
  showBreadcrumbs = false,
  leftAction,
}: AppHeaderProps) {
  const resolvedNav = navSlot ?? leftAction;

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-20 -mx-4 px-5 sm:px-6",
        "pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.75rem),calc(env(safe-area-inset-top,0px)+0.75rem))] pb-4 sm:pb-5",
        glass.nav,
        className,
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo above the grid row (when enabled) */}
      {showLogo && (
        <div className="flex justify-center mb-2">
          <AppLogo size="sm" variant="default" />
        </div>
      )}

      <motion.div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Zone 1: nav / back button */}
        <div className="flex items-center gap-2 min-w-0">{resolvedNav}</div>

        {/* Zone 2: title, breadcrumbs, icon */}
        <div className="flex flex-col items-center min-w-0">
          {(breadcrumbs || showBreadcrumbs) && (
            <Breadcrumbs items={breadcrumbs} className="mb-1 text-[0.6875rem]" showHome={true} />
          )}
          <div className="flex items-center gap-2 justify-center">
            {icon && (
              <motion.div
                className="flex-shrink-0 p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {icon}
              </motion.div>
            )}
            <div className="text-center min-w-0">
              {titleElement || (title && <h2 className="text-base sm:text-lg font-bold truncate">{title}</h2>)}
              {!titleElement && subtitle && (
                <p className="text-[0.6875rem] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Zone 3: actions */}
        {rightAction && <div className="flex items-center gap-1.5 justify-end min-w-0">{rightAction}</div>}
      </motion.div>
    </motion.header>
  );
}
