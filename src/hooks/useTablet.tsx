/**
 * useIsTablet - Detect tablet devices
 * Tablets are devices between 640px and 1024px
 *
 * This is useful for applying specific optimizations for tablet layouts,
 * such as two-column grids that don't work well on mobile but are
 * too sparse on large desktop screens.
 *
 * @example
 * ```tsx
 * const isTablet = useIsTablet();
 *
 * return (
 *   <div className={isTablet ? "grid-cols-2" : "grid-cols-3"}>
 *     {items}
 *   </div>
 * );
 * ```
 */

import * as React from "react";

const TABLET_MIN = 640;
const TABLET_MAX = 1024;

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${TABLET_MIN}px) and (max-width: ${TABLET_MAX}px)`
    );
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= TABLET_MIN && window.innerWidth <= TABLET_MAX
      );
    };
    mql.addEventListener("change", onChange);
    setIsTablet(
      window.innerWidth >= TABLET_MIN && window.innerWidth <= TABLET_MAX
    );
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

/**
 * useResponsive - Breakpoint detection for multiple screen sizes
 * Returns an object with boolean flags for each breakpoint
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, isWide } = useResponsive();
 *
 * if (isMobile) return <MobileLayout />;
 * if (isTablet) return <TabletLayout />;
 * return <DesktopLayout />;
 * ```
 */
export function useResponsive() {
  const [breakpoints, setBreakpoints] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isWide: false,
  });

  React.useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024 && width < 1536,
        isWide: width >= 1536,
      });
    };

    updateBreakpoints();

    const mql = window.matchMedia('(min-width: 640px)');
    mql.addEventListener('change', updateBreakpoints);

    return () => mql.removeEventListener('change', updateBreakpoints);
  }, []);

  return breakpoints;
}

export default useIsTablet;
