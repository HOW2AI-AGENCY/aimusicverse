/* eslint-disable react-refresh/only-export-components */
/**
 * Accessibility utilities and hooks
 * Components only — non-component exports live in a11y-utils.ts
 * Phase 5: WCAG 2.1 AA compliance helpers
 */

export {
  announceToScreenReader,
  checkContrastRatio,
  useAriaLive,
  useArrowKeyNavigation,
  useFocusTrap,
  useId,
  usePrefersHighContrast,
  usePrefersReducedMotion,
} from "./a11y-utils";

/**
 * Component for visually hiding content but keeping it accessible to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({
  href,
  children = "Перейти к основному содержимому",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </a>
  );
}
