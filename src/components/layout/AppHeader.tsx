/**
 * AppHeader - Unified header with centered logo for all pages
 * Accounts for Telegram safe area and native buttons
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
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  /** Custom title element to replace the default title text */
  titleElement?: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  /** Breadcrumb items for nested navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Whether to show auto-generated breadcrumbs based on route */
  showBreadcrumbs?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  icon,
  leftAction,
  rightAction,
  titleElement,
  className,
  showLogo = false,
  breadcrumbs,
  showBreadcrumbs = false,
}: AppHeaderProps) {
  return (
    <motion.header
      className={cn(
        "sticky top-0 z-20 -mx-4 px-5 sm:px-6",
        // Telegram content safe area for native buttons
        "pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.75rem),calc(env(safe-area-inset-top,0px)+0.75rem))] pb-4 sm:pb-5",
        glass.nav,
        className,
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Optional centered Logo (off by default) */}
      {showLogo && (
        <div className="flex justify-center mb-2">
          <AppLogo size="sm" variant="default" />
        </div>
      )}

      {/* Mobile: stacked & centered. Desktop: title centered with side actions */}
      <motion.div
        className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Left action (desktop only spacer) */}
        {leftAction && <div className="hidden sm:flex items-center gap-2 flex-shrink-0 min-w-[40px]">{leftAction}</div>}

        {/* Title section */}
        <div className="flex flex-col items-center sm:flex-1 min-w-0">
          {(breadcrumbs || showBreadcrumbs) && (
            <Breadcrumbs items={breadcrumbs} className="mb-1 text-[11px]" showHome={true} />
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
              {titleElement || <h2 className="text-base sm:text-lg font-bold truncate">{title}</h2>}
              {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Actions: centered row on mobile, right-aligned on desktop */}
        {rightAction && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end sm:flex-nowrap sm:flex-shrink-0 sm:min-w-[40px]">
            {rightAction}
          </div>
        )}
      </motion.div>
    </motion.header>
  );
}
