/**
 * useSwipeGesture - Simplified swipe gesture hook
 * Returns direction and progress for swipe animations
 */

import { useState, useCallback, useRef } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  preventScroll?: boolean;
}

interface SwipeState {
  direction: SwipeDirection;
  progress: number; // 0 to 1
  offset: { x: number; y: number };
  isSwiping: boolean;
}

export function useSwipeGesture(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    preventScroll = false,
  } = config;

  const [state, setState] = useState<SwipeState>({
    direction: null,
    progress: 0,
    offset: { x: 0, y: 0 },
    isSwiping: false,
  });

  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const haptic = useHapticFeedback();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setState(prev => ({ ...prev, isSwiping: true }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine primary direction
    let direction: SwipeDirection = null;
    let primaryDelta = 0;

    if (absX > absY && absX > 10) {
      direction = deltaX > 0 ? 'right' : 'left';
      primaryDelta = absX;
      if (preventScroll) e.preventDefault();
    } else if (absY > absX && absY > 10) {
      direction = deltaY > 0 ? 'down' : 'up';
      primaryDelta = absY;
    }

    const progress = Math.min(1, primaryDelta / threshold);

    setState({
      direction,
      progress,
      offset: { x: deltaX, y: deltaY },
      isSwiping: true,
    });
  }, [threshold, preventScroll]);

  const handleTouchEnd = useCallback(() => {
    if (!startRef.current) return;

    const { direction, progress } = state;
    const deltaTime = Date.now() - startRef.current.time;

    // Quick swipe or passed threshold
    const isValidSwipe = progress >= 1 || (progress > 0.3 && deltaTime < 300);

    if (isValidSwipe && direction) {
      haptic.selectionChanged();
      
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    // Reset
    startRef.current = null;
    setState({
      direction: null,
      progress: 0,
      offset: { x: 0, y: 0 },
      isSwiping: false,
    });
  }, [state, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, haptic]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    handlers,
    ...state,
  };
}
