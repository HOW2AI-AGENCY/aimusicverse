import { useEffect } from "react";

/**
 * Lock document body scroll while `active` is true.
 * Preserves prior overflow value and restores it on unmount / deactivation.
 * Targets <body> (not sheet root) to avoid iOS Safari rubber-band.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Safety: restore scroll after 10s even if cleanup fails
    const safety = setTimeout(() => {
      document.body.style.overflow = previous;
    }, 10_000);
    return () => {
      clearTimeout(safety);
      document.body.style.overflow = previous;
    };
  }, [active]);
}
