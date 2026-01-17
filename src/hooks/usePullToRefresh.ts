import { useState, useRef, useCallback, useEffect } from 'react';
import { useHaptic } from './useHaptic';

interface UsePullToRefreshOptions {
  /** Threshold distance to trigger refresh (default: 80px) */
  threshold?: number;
  /** Async function to call on refresh */
  onRefresh: () => Promise<void>;
  /** Whether pull to refresh is enabled */
  enabled?: boolean;
}

interface UsePullToRefreshReturn {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefCallback<HTMLElement>;
  /** Current pull distance (for UI feedback) */
  pullDistance: number;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Whether user is actively pulling */
  isPulling: boolean;
  /** Progress towards threshold (0-1) */
  progress: number;
}

/**
 * Hook for pull-to-refresh functionality on mobile
 */
export function usePullToRefresh({
  threshold = 80,
  onRefresh,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  // Use refs to avoid stale closures in event handlers
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const { patterns } = useHaptic();

  // Keep refs in sync with state
  isPullingRef.current = isPulling;
  pullDistanceRef.current = pullDistance;
  isRefreshingRef.current = isRefreshing;

  const containerRef = useCallback((node: HTMLElement | null) => {
    setContainer(node);
  }, []);

  // Store onRefresh in ref to avoid recreating handlers
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!container || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable when scrolled to top
      if (container.scrollTop > 0) return;
      
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Use ref for immediate value check
      if (!isPullingRef.current || container.scrollTop > 0) return;

      currentYRef.current = e.touches[0].clientY;
      const distance = Math.max(0, currentYRef.current - startYRef.current);
      
      // Apply resistance (logarithmic) for natural feel
      const resistedDistance = Math.min(threshold * 1.5, distance * 0.5);
      pullDistanceRef.current = resistedDistance;
      setPullDistance(resistedDistance);

      // Haptic feedback when crossing threshold
      if (resistedDistance >= threshold && pullDistanceRef.current < threshold) {
        patterns.tap();
      }

      // Prevent default scroll only when actively pulling down
      if (distance > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      isPullingRef.current = false;
      setIsPulling(false);

      const currentPullDistance = pullDistanceRef.current;

      if (currentPullDistance >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        patterns.success();
        
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }

      // Animate back
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [container, enabled, threshold, patterns]);

  const progress = Math.min(1, pullDistance / threshold);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
  };
}
