import * as React from "react";

/**
 * Mobile breakpoint matches Tailwind's `sm:` breakpoint (640px)
 * This ensures consistent behavior between CSS and JavaScript logic
 *
 * - Mobile: < 640px (matches `max-sm:` in Tailwind)
 * - Tablet/Desktop: >= 640px (matches `sm:` in Tailwind)
 */
const MOBILE_BREAKPOINT = 640;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
