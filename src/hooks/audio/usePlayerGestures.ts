/**
 * Player Gesture Controls Hook
 * 
 * Provides swipe gestures for mobile player:
 * - Swipe left/right for track switching
 * - Pull to expand/collapse player
 * - Enhanced touch responsiveness
 */

import { useCallback, useRef, useState } from 'react';
import { usePlayerStore } from './usePlayerState';
import { hapticImpact } from '@/lib/haptic';

export interface PlayerGestureConfig {
  /** Minimum swipe distance to trigger action (default: 50px) */
  swipeThreshold?: number;
  /** Minimum velocity to trigger action (default: 0.3) */
  velocityThreshold?: number;
  /** Pull distance to expand/collapse (default: 80px) */
  pullThreshold?: number;
  /** Enable haptic feedback (default: true) */
  enableHaptics?: boolean;
}

export interface GestureState {
  /** Current horizontal offset during swipe */
  offsetX: number;
  /** Current vertical offset during pull */
  offsetY: number;
  /** Whether a swipe gesture is active */
  isSwiping: boolean;
  /** Whether a pull gesture is active */
  isPulling: boolean;
  /** Direction of current gesture */
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function usePlayerGestures(config: PlayerGestureConfig = {}) {
  const {
    swipeThreshold = 50,
    velocityThreshold = 0.3,
    pullThreshold = 80,
    enableHaptics = true,
  } = config;

  const { nextTrack, previousTrack, playerMode, setPlayerMode } = usePlayerStore();

  const [gestureState, setGestureState] = useState<GestureState>({
    offsetX: 0,
    offsetY: 0,
    isSwiping: false,
    isPulling: false,
    direction: null,
  });

  // Touch tracking refs
  const startTouchRef = useRef<TouchPoint | null>(null);
  const lastTouchRef = useRef<TouchPoint | null>(null);
  const gestureStartedRef = useRef(false);
  const gestureTypeRef = useRef<'swipe' | 'pull' | null>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (enableHaptics) {
      hapticImpact(type);
    }
  }, [enableHaptics]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    startTouchRef.current = point;
    lastTouchRef.current = point;
    gestureStartedRef.current = false;
    gestureTypeRef.current = null;
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startTouchRef.current) return;

    const touch = e.touches[0];
    const currentPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = currentPoint.x - startTouchRef.current.x;
    const deltaY = currentPoint.y - startTouchRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine gesture type on first significant movement
    if (!gestureStartedRef.current && (absDeltaX > 10 || absDeltaY > 10)) {
      gestureStartedRef.current = true;
      gestureTypeRef.current = absDeltaX > absDeltaY ? 'swipe' : 'pull';
      triggerHaptic('light');
    }

    if (!gestureStartedRef.current) {
      lastTouchRef.current = currentPoint;
      return;
    }

    // Handle swipe gesture (horizontal)
    if (gestureTypeRef.current === 'swipe') {
      e.preventDefault(); // Prevent scroll during swipe
      
      // Apply resistance at edges
      const resistance = 0.5;
      const resistedDelta = deltaX * (1 - Math.min(absDeltaX / 300, 1) * resistance);
      
      setGestureState({
        offsetX: resistedDelta,
        offsetY: 0,
        isSwiping: true,
        isPulling: false,
        direction: deltaX > 0 ? 'right' : 'left',
      });
    }
    
    // Handle pull gesture (vertical)
    else if (gestureTypeRef.current === 'pull') {
      // Apply resistance
      const resistance = 0.6;
      const resistedDelta = deltaY * (1 - Math.min(absDeltaY / 200, 1) * resistance);
      
      setGestureState({
        offsetX: 0,
        offsetY: resistedDelta,
        isSwiping: false,
        isPulling: true,
        direction: deltaY > 0 ? 'down' : 'up',
      });
    }

    lastTouchRef.current = currentPoint;
  }, [triggerHaptic]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!startTouchRef.current || !lastTouchRef.current || !gestureStartedRef.current) {
      // Reset state
      startTouchRef.current = null;
      lastTouchRef.current = null;
      setGestureState({
        offsetX: 0,
        offsetY: 0,
        isSwiping: false,
        isPulling: false,
        direction: null,
      });
      return;
    }

    const deltaX = lastTouchRef.current.x - startTouchRef.current.x;
    const deltaY = lastTouchRef.current.y - startTouchRef.current.y;
    const timeDelta = lastTouchRef.current.time - startTouchRef.current.time;
    
    // Calculate velocity (pixels per ms)
    const velocityX = Math.abs(deltaX) / timeDelta;
    const velocityY = Math.abs(deltaY) / timeDelta;

    // Handle swipe completion
    if (gestureTypeRef.current === 'swipe') {
      const shouldTrigger = Math.abs(deltaX) > swipeThreshold || velocityX > velocityThreshold;
      
      if (shouldTrigger) {
        if (deltaX < 0) {
          // Swipe left -> next track
          triggerHaptic('medium');
          nextTrack();
        } else {
          // Swipe right -> previous track
          triggerHaptic('medium');
          previousTrack();
        }
      }
    }
    
    // Handle pull completion
    else if (gestureTypeRef.current === 'pull') {
      const shouldTrigger = Math.abs(deltaY) > pullThreshold || velocityY > velocityThreshold;
      
      if (shouldTrigger) {
        triggerHaptic('medium');
        
        if (deltaY < 0) {
          // Pull up -> expand
          if (playerMode === 'compact') {
            setPlayerMode('expanded');
          } else if (playerMode === 'expanded') {
            setPlayerMode('fullscreen');
          }
        } else {
          // Pull down -> collapse
          if (playerMode === 'fullscreen') {
            setPlayerMode('expanded');
          } else if (playerMode === 'expanded') {
            setPlayerMode('compact');
          } else if (playerMode === 'compact') {
            setPlayerMode('minimized');
          }
        }
      }
    }

    // Reset state with spring-back animation handled by caller
    startTouchRef.current = null;
    lastTouchRef.current = null;
    gestureStartedRef.current = false;
    gestureTypeRef.current = null;
    
    setGestureState({
      offsetX: 0,
      offsetY: 0,
      isSwiping: false,
      isPulling: false,
      direction: null,
    });
  }, [swipeThreshold, velocityThreshold, pullThreshold, nextTrack, previousTrack, playerMode, setPlayerMode, triggerHaptic]);

  // Touch event handlers object for spreading onto elements
  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  // Computed values for UI
  const swipeProgress = Math.min(Math.abs(gestureState.offsetX) / swipeThreshold, 1);
  const pullProgress = Math.min(Math.abs(gestureState.offsetY) / pullThreshold, 1);

  return {
    gestureState,
    gestureHandlers,
    swipeProgress,
    pullProgress,
    isGesturing: gestureState.isSwiping || gestureState.isPulling,
  };
}
