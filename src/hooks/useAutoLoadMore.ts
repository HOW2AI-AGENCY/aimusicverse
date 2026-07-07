/**
 * useAutoLoadMore — IntersectionObserver-based auto-loading sentinel.
 *
 * Returns a ref to attach to a small sentinel element at the end of a list.
 * When the sentinel scrolls into (or near) the viewport and `hasMore` is true
 * and we're not already loading, calls `onLoadMore()`.
 *
 * Preloads the next page ~600px before the user reaches the end, so track
 * cards render seamlessly on scroll instead of after a manual button press.
 */
import { useEffect, useRef } from "react";

interface Options {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  /** Distance (px) from viewport at which to trigger the load. */
  rootMargin?: string;
  /** Disable auto-load entirely (falls back to manual button). */
  disabled?: boolean;
}

export function useAutoLoadMore<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "600px",
  disabled = false,
}: Options) {
  const sentinelRef = useRef<T | null>(null);

  useEffect(() => {
    if (disabled || !hasMore || isLoading) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin, disabled]);

  return sentinelRef;
}
