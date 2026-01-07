/**
 * useStudioGestures - Mobile gesture controls for studio
 * 
 * Provides:
 * - Pinch-to-zoom for timeline
 * - Swipe gestures for navigation
 * - Long press for context actions
 * - Two-finger scroll for horizontal pan
 */

import { useRef, useCallback, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { logger } from '@/lib/logger';

export interface GestureConfig {
  /** Enable pinch-to-zoom */
  enableZoom?: boolean;
  /** Enable swipe gestures */
  enableSwipe?: boolean;
  /** Enable long press */
  enableLongPress?: boolean;
  /** Enable horizontal pan with two fingers */
  enablePan?: boolean;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Swipe threshold in pixels */
  swipeThreshold?: number;
  /** Long press duration in ms */
  longPressDuration?: number;
}

export interface GestureCallbacks {
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (offset: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: (point: { x: number; y: number }) => void;
  onDoubleTap?: (point: { x: number; y: number }) => void;
}

const DEFAULT_CONFIG: Required<GestureConfig> = {
  enableZoom: true,
  enableSwipe: true,
  enableLongPress: true,
  enablePan: true,
  minZoom: 0.5,
  maxZoom: 4,
  swipeThreshold: 50,
  longPressDuration: 500,
};

export function useStudioGestures(
  config: GestureConfig = {},
  callbacks: GestureCallbacks = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const zoomRef = useRef(1);
  const panOffsetRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(type);
      } else if (navigator.vibrate) {
        const duration = type === 'light' ? 10 : type === 'medium' ? 25 : 50;
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore haptic errors
    }
  }, []);

  // Clear long press timer
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPress();
    };
  }, [clearLongPress]);

  const bind = useGesture(
    {
      onPinch: ({ offset: [scale], memo, first, last }) => {
        if (!mergedConfig.enableZoom) return memo;

        if (first) {
          triggerHaptic('light');
        }

        const newZoom = Math.max(
          mergedConfig.minZoom,
          Math.min(mergedConfig.maxZoom, scale)
        );

        if (Math.abs(newZoom - zoomRef.current) > 0.01) {
          zoomRef.current = newZoom;
          callbacks.onZoomChange?.(newZoom);
        }

        if (last) {
          triggerHaptic('medium');
          logger.debug('[Gestures] Zoom complete', { zoom: newZoom });
        }

        return memo;
      },

      onDrag: ({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], last, first, xy: [x, y], touches }) => {
        // Handle two-finger pan
        if (touches === 2 && mergedConfig.enablePan) {
          const newOffset = panOffsetRef.current + mx * 0.5;
          panOffsetRef.current = newOffset;
          callbacks.onPanChange?.(newOffset);
          return;
        }

        // Handle swipe gestures (single finger, high velocity)
        if (last && mergedConfig.enableSwipe) {
          const velocity = Math.sqrt(vx * vx + vy * vy);
          
          if (velocity > 0.5) {
            if (Math.abs(mx) > mergedConfig.swipeThreshold) {
              if (dx > 0) {
                triggerHaptic('light');
                callbacks.onSwipeRight?.();
                logger.debug('[Gestures] Swipe right');
              } else {
                triggerHaptic('light');
                callbacks.onSwipeLeft?.();
                logger.debug('[Gestures] Swipe left');
              }
            }
            
            if (Math.abs(my) > mergedConfig.swipeThreshold) {
              if (dy > 0) {
                triggerHaptic('light');
                callbacks.onSwipeDown?.();
                logger.debug('[Gestures] Swipe down');
              } else {
                triggerHaptic('light');
                callbacks.onSwipeUp?.();
                logger.debug('[Gestures] Swipe up');
              }
            }
          }
        }

        // Handle long press start
        if (first && mergedConfig.enableLongPress) {
          clearLongPress();
          longPressTimerRef.current = setTimeout(() => {
            triggerHaptic('heavy');
            callbacks.onLongPress?.({ x, y });
            logger.debug('[Gestures] Long press', { x, y });
          }, mergedConfig.longPressDuration);
        }

        // Cancel long press on movement
        if (!first && !last) {
          const movement = Math.sqrt(mx * mx + my * my);
          if (movement > 10) {
            clearLongPress();
          }
        }

        // Clear long press on end
        if (last) {
          clearLongPress();
        }
      },

      onPointerDown: ({ event }) => {
        const x = event.clientX;
        const y = event.clientY;
        
        // Double tap detection
        const now = Date.now();
        const lastTap = lastTapRef.current;

        if (lastTap && now - lastTap.time < 300) {
          const distance = Math.sqrt(
            Math.pow(x - lastTap.x, 2) + Math.pow(y - lastTap.y, 2)
          );
          
          if (distance < 50) {
            triggerHaptic('medium');
            callbacks.onDoubleTap?.({ x, y });
            logger.debug('[Gestures] Double tap', { x, y });
            lastTapRef.current = null;
            return;
          }
        }

        lastTapRef.current = { time: now, x, y };
      },
    },
    {
      pinch: {
        scaleBounds: { min: mergedConfig.minZoom, max: mergedConfig.maxZoom },
        rubberband: true,
      },
      drag: {
        filterTaps: true,
        threshold: 5,
      },
    }
  );

  return {
    bind,
    zoom: zoomRef.current,
    panOffset: panOffsetRef.current,
    resetZoom: useCallback(() => {
      zoomRef.current = 1;
      callbacks.onZoomChange?.(1);
    }, [callbacks]),
    resetPan: useCallback(() => {
      panOffsetRef.current = 0;
      callbacks.onPanChange?.(0);
    }, [callbacks]),
  };
}

// Simplified hook for just zoom control
export function usePinchZoom(
  onZoom: (zoom: number) => void,
  options: { min?: number; max?: number } = {}
) {
  return useStudioGestures(
    {
      enableZoom: true,
      enableSwipe: false,
      enableLongPress: false,
      enablePan: false,
      minZoom: options.min ?? 0.5,
      maxZoom: options.max ?? 4,
    },
    { onZoomChange: onZoom }
  );
}

// Simplified hook for swipe navigation
export function useSwipeNavigation(callbacks: {
  onNext?: () => void;
  onPrev?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return useStudioGestures(
    {
      enableZoom: false,
      enableSwipe: true,
      enableLongPress: false,
      enablePan: false,
    },
    {
      onSwipeLeft: callbacks.onNext,
      onSwipeRight: callbacks.onPrev,
      onSwipeUp: callbacks.onUp,
      onSwipeDown: callbacks.onDown,
    }
  );
}
