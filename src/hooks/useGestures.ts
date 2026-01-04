/**
 * useGestures - Unified gesture handling hook for mobile interactions
 */

import { useCallback, useRef, useState } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

type HapticFeedback = ReturnType<typeof useHapticFeedback>;

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  startDistance: number;
}

export function useGestures(config: GestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    onDoubleTap,
    swipeThreshold = 50,
    longPressDelay = 500,
  } = config;

  const haptic = useHapticFeedback();
  const touchRef = useRef<TouchState | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const t0 = touches.item(0);
    const t1 = touches.item(1);
    if (!t0 || !t1) return 0;
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      startDistance: e.touches.length >= 2 ? getDistance(e.touches) : 0,
    };

    // Check for double tap
    const now = Date.now();
    if (now - lastTapRef.current < 300 && onDoubleTap) {
      onDoubleTap();
      haptic.selectionChanged();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        haptic.impact('medium');
      }, longPressDelay);
    }

    // Check for pinch start
    if (e.touches.length >= 2) {
      setIsPinching(true);
    }
  }, [onDoubleTap, onLongPress, longPressDelay, haptic]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel long press on movement
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch
    if (isPinching && e.touches.length >= 2 && touchRef.current && onPinch) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / touchRef.current.startDistance;
      onPinch(scale);
    }
  }, [isPinching, onPinch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchRef.current.startX;
    const deltaY = touch.clientY - touchRef.current.startY;
    const deltaTime = Date.now() - touchRef.current.startTime;

    // Only detect swipes for quick gestures
    if (deltaTime < 300) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > swipeThreshold && absX > absY) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          haptic.selectionChanged();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          haptic.selectionChanged();
        }
      }

      // Vertical swipe
      if (absY > swipeThreshold && absY > absX) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
          haptic.selectionChanged();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
          haptic.selectionChanged();
        }
      }
    }

    setIsPinching(false);
    touchRef.current = null;
  }, [swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, haptic]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    gestureHandlers,
    isPinching,
  };
}
