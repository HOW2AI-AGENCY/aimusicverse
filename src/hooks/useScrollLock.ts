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
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
