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
  const { patterns } = useHaptic();

  const containerRef = useCallback((node: HTMLElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable when scrolled to top
      if (container.scrollTop > 0) return;
      
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || container.scrollTop > 0) return;

      currentYRef.current = e.touches[0].clientY;
      const distance = Math.max(0, currentYRef.current - startYRef.current);
      
      // Apply resistance (logarithmic) for natural feel
      const resistedDistance = Math.min(threshold * 1.5, distance * 0.5);
      setPullDistance(resistedDistance);

      // Haptic feedback when crossing threshold
      if (resistedDistance >= threshold && pullDistance < threshold) {
        patterns.tap();
      }

      // Prevent scroll while pulling
      if (distance > 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        patterns.success();
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      // Animate back
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
  }, [container, enabled, isPulling, pullDistance, threshold, isRefreshing, onRefresh, patterns]);

  const progress = Math.min(1, pullDistance / threshold);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
  };
}
