/**
 * Mobile Detection and Responsive Utilities
 * 
 * Provides utilities for:
 * - Mobile device detection
 * - Touch event handling
 * - Viewport size management
 * - Responsive breakpoints
 */

import { useState, useEffect, useCallback, type TouchEvent } from 'react';

/**
 * Breakpoint constants (matching Tailwind CSS defaults)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook to detect if device is mobile based on viewport width
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns True if viewport width is below breakpoint
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.md): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Touch event coordinates
 */
interface TouchCoordinates {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Touch event handlers configuration
 */
interface TouchEventHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  longPressDelay?: number; // Long press duration (default: 500ms)
}

/**
 * Hook for handling touch events (swipe, tap, long press)
 * @param handlers - Touch event handlers configuration
 * @returns Touch event handlers to attach to element
 */
export function useTouchEvents(handlers: TouchEventHandlers) {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500,
  } = handlers;

  const [touchStart, setTouchStart] = useState<TouchCoordinates | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const coords: TouchCoordinates = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };
      setTouchStart(coords);

      // Start long press timer
      if (onLongPress) {
        const timer = setTimeout(() => {
          onLongPress();
          setTouchStart(null); // Clear to prevent other gestures
        }, longPressDelay);
        setLongPressTimer(timer);
      }
    },
    [onLongPress, longPressDelay]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.timestamp;

      // Detect tap (minimal movement, quick release)
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        onTap?.();
        setTouchStart(null);
        return;
      }

      // Detect swipe direction
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      setTouchStart(null);
    },
    [touchStart, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap, threshold, longPressTimer]
  );

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setTouchStart(null);
  }, [longPressTimer]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

/**
 * Detect if device supports touch events
 * @returns True if device has touch support
 */
export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Viewport size
 */
interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Hook to get current viewport size
 * @returns Current viewport width and height
 */
export function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Hook to track viewport size changes
 * @returns Current viewport size (updates on resize)
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(getViewportSize);

  useEffect(() => {
    const handleResize = () => {
      setSize(getViewportSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Check if viewport matches a specific breakpoint
 * @param breakpoint - Breakpoint key from BREAKPOINTS
 * @returns True if viewport width is >= breakpoint
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS[breakpoint];
  });

  useEffect(() => {
    const handleResize = () => {
      setMatches(window.innerWidth >= BREAKPOINTS[breakpoint]);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return matches;
}

/**
 * Get device type based on user agent and viewport
 * @returns Device type: 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const isTabletUA = /tablet|ipad/i.test(userAgent);
  const { width } = getViewportSize();

  if (isTabletUA || (width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg)) {
    return 'tablet';
  }

  if (isMobileUA || width < BREAKPOINTS.sm) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Hook to get device type (updates on resize)
 * @returns Current device type
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(getDeviceType);

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

/**
 * Haptic feedback types
 */
export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback on supported devices
 * @param type - Type of haptic feedback (default: 'light')
 * @returns True if haptic feedback was triggered
 */
export function triggerHapticFeedback(type: HapticFeedbackType = 'light'): boolean {
  if (typeof window === 'undefined') return false;

  // Check if Telegram WebApp is available
  if ((window as any).Telegram?.WebApp?.HapticFeedback) {
    const haptic = (window as any).Telegram.WebApp.HapticFeedback;
    
    switch (type) {
      case 'light':
        haptic.impactOccurred('light');
        return true;
      case 'medium':
        haptic.impactOccurred('medium');
        return true;
      case 'heavy':
        haptic.impactOccurred('heavy');
        return true;
      case 'selection':
        haptic.selectionChanged();
        return true;
      case 'success':
        haptic.notificationOccurred('success');
        return true;
      case 'warning':
        haptic.notificationOccurred('warning');
        return true;
      case 'error':
        haptic.notificationOccurred('error');
        return true;
    }
  }

  // Fallback to standard Vibration API
  if (navigator.vibrate) {
    const duration = type === 'heavy' ? 30 : type === 'medium' ? 20 : 10;
    navigator.vibrate(duration);
    return true;
  }

  return false;
}

/**
 * Hook for haptic feedback with memoized callback
 * @param type - Type of haptic feedback
 * @returns Callback to trigger haptic feedback
 */
export function useHapticFeedback(type: HapticFeedbackType = 'light') {
  return useCallback(() => {
    triggerHapticFeedback(type);
  }, [type]);
}
