/**
 * useGestures Hook
 *
 * A comprehensive gesture recognition hook for touch interactions.
 * Supports swipe, tap, long press, pinch, and rotate gestures.
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Mobile Optimization
 */

import * as React from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GestureHandlers {
  onSwipeLeft?: (distance: number, velocity: number) => void;
  onSwipeRight?: (distance: number, velocity: number) => void;
  onSwipeUp?: (distance: number, velocity: number) => void;
  onSwipeDown?: (distance: number, velocity: number) => void;
  onTap?: (event: React.TouchEvent) => void;
  onDoubleTap?: (event: React.TouchEvent) => void;
  onLongPress?: (event: React.TouchEvent) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
}

export interface GestureOptions {
  /**
   * Minimum distance for swipe detection (pixels)
   * @default 50
   */
  swipeThreshold?: number;

  /**
   * Minimum velocity for swipe detection (pixels/ms)
   * @default 0.3
   */
  swipeVelocityThreshold?: number;

  /**
   * Maximum duration for tap recognition (ms)
   * @default 300
   */
  tapMaxDuration?: number;

  /**
   * Duration for long press recognition (ms)
   * @default 500
   */
  longPressDuration?: number;

  /**
   * Maximum time between taps for double tap (ms)
   * @default 300
   */
  doubleTapMaxDelay?: number;

  /**
   * Minimum scale change for pinch detection
   * @default 0.01
   */
  pinchThreshold?: number;

  /**
   * Minimum angle change for rotation detection (degrees)
   * @default 5
   */
  rotateThreshold?: number;

  /**
   * Whether to prevent default on touch events
   * @default false
   */
  preventDefault?: boolean;

  /**
   * Whether to stop propagation on touch events
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Whether gestures should be disabled
   * @default false
   */
  disabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  distanceX: number;
  distanceY: number;
  velocityX: number;
  velocityY: number;
  isSwipe: boolean;
}

interface PinchState {
  initialDistance: number;
  initialAngle: number;
  center: { x: number; y: number };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useGestures(handlers: GestureHandlers, options: GestureOptions = {}) {
  const {
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.3,
    tapMaxDuration = 300,
    longPressDuration = 500,
    doubleTapMaxDelay = 300,
    pinchThreshold = 0.01,
    rotateThreshold = 5,
    preventDefault = false,
    stopPropagation = false,
    disabled = false,
  } = options;

  const touchStateRef = React.useRef<TouchState | null>(null);
  const pinchStateRef = React.useRef<PinchState | null>(null);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = React.useRef<number>(0);

  // Reset state
  const resetState = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStateRef.current = null;
    pinchStateRef.current = null;
  }, []);

  // Calculate distance between two touches
  const getDistance = React.useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between two touches
  const getAngle = React.useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, []);

  // Get center point between two touches
  const getCenter = React.useCallback((touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Handle touch start
  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent) => {
      if (disabled) return;
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();

      const touch = event.touches[0];
      const now = Date.now();

      // Check for double tap
      if (now - lastTapTimeRef.current < doubleTapMaxDelay) {
        handlers.onDoubleTap?.(event);
        lastTapTimeRef.current = 0;
        return;
      }

      lastTapTimeRef.current = now;

      // Handle multi-touch (pinch/rotate)
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = getDistance(touch1, touch2);
        const angle = getAngle(touch1, touch2);
        const center = getCenter(touch1, touch2);

        pinchStateRef.current = {
          initialDistance: distance,
          initialAngle: angle,
          center,
        };
        return;
      }

      // Handle single touch
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastTime: now,
        distanceX: 0,
        distanceY: 0,
        velocityX: 0,
        velocityY: 0,
        isSwipe: false,
      };

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (touchStateRef.current && !touchStateRef.current.isSwipe) {
          handlers.onLongPress?.(event);
        }
      }, longPressDuration);
    },
    [
      disabled,
      preventDefault,
      stopPropagation,
      doubleTapMaxDelay,
      longPressDuration,
      handlers,
      getDistance,
      getAngle,
      getCenter,
    ],
  );

  // Handle touch move
  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent) => {
      if (disabled) return;
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();

      // Handle multi-touch (pinch/rotate)
      if (event.touches.length === 2 && pinchStateRef.current) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = getDistance(touch1, touch2);
        const angle = getAngle(touch1, touch2);
        const center = getCenter(touch1, touch2);

        const scale = distance / pinchStateRef.current.initialDistance;
        const rotation = angle - pinchStateRef.current.initialAngle;

        if (Math.abs(scale - 1) > pinchThreshold) {
          handlers.onPinch?.(scale, center);
        }

        if (Math.abs(rotation) > rotateThreshold) {
          handlers.onRotate?.(rotation, center);
        }

        return;
      }

      // Handle single touch
      if (!touchStateRef.current || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const now = Date.now();
      const state = touchStateRef.current;

      const deltaTime = now - state.lastTime;
      const deltaX = touch.clientX - state.lastX;
      const deltaY = touch.clientY - state.lastY;

      state.distanceX = touch.clientX - state.startX;
      state.distanceY = touch.clientY - state.startY;
      state.velocityX = deltaTime > 0 ? deltaX / deltaTime : 0;
      state.velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;

      // Check if this is a swipe
      const totalDistance = Math.sqrt(state.distanceX * state.distanceX + state.distanceY * state.distanceY);
      const totalVelocity = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY);

      if (totalDistance > 10 && totalVelocity > swipeVelocityThreshold) {
        state.isSwipe = true;
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
      state.lastTime = now;
    },
    [
      disabled,
      preventDefault,
      stopPropagation,
      swipeVelocityThreshold,
      pinchThreshold,
      rotateThreshold,
      handlers,
      getDistance,
      getAngle,
      getCenter,
    ],
  );

  // Handle touch end
  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent) => {
      if (disabled) return;
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();

      const state = touchStateRef.current;
      if (!state) {
        resetState();
        return;
      }

      const touch = event.changedTouches[0];
      const now = Date.now();
      const duration = now - state.startTime;

      // Check for swipe
      const absDistanceX = Math.abs(state.distanceX);
      const absDistanceY = Math.abs(state.distanceY);

      if (state.isSwipe) {
        const absVelocityX = Math.abs(state.velocityX);
        const absVelocityY = Math.abs(state.velocityY);

        if (absDistanceX > swipeThreshold && absVelocityX > swipeVelocityThreshold) {
          if (state.distanceX > 0) {
            handlers.onSwipeRight?.(absDistanceX, absVelocityX);
          } else {
            handlers.onSwipeLeft?.(absDistanceX, absVelocityX);
          }
        } else if (absDistanceY > swipeThreshold && absVelocityY > swipeVelocityThreshold) {
          if (state.distanceY > 0) {
            handlers.onSwipeDown?.(absDistanceY, absVelocityY);
          } else {
            handlers.onSwipeUp?.(absDistanceY, absVelocityY);
          }
        }
      } else if (duration < tapMaxDuration) {
        // This is a tap
        handlers.onTap?.(event);
      }

      resetState();
    },
    [
      disabled,
      preventDefault,
      stopPropagation,
      swipeThreshold,
      swipeVelocityThreshold,
      tapMaxDuration,
      handlers,
      resetState,
    ],
  );

  // Handle touch cancel
  const handleTouchCancel = React.useCallback(
    (event: React.TouchEvent) => {
      if (disabled) return;
      resetState();
    },
    [disabled, resetState],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}
