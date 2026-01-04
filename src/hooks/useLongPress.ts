/**
 * useLongPress - Hook for long press gesture detection
 * With configurable delay and haptic feedback
 */

import { useCallback, useRef, useState } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
  onPress?: () => void;
  onCancel?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

export function useLongPress({
  delay = 500,
  onLongPress,
  onPress,
  onCancel,
  hapticStyle = 'medium',
}: LongPressOptions) {
  const [isPressing, setIsPressing] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const haptic = useHapticFeedback();

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Get start position
    if ('touches' in e) {
      startPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    }

    setIsPressing(true);
    setIsLongPressed(false);

    timerRef.current = setTimeout(() => {
      setIsLongPressed(true);
      haptic.impact(hapticStyle);
      onLongPress();
    }, delay);
  }, [delay, onLongPress, haptic, hapticStyle]);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPosRef.current || !timerRef.current) return;

    // Get current position
    let currentX: number, currentY: number;
    if ('touches' in e) {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }

    // Cancel if moved too far
    const dx = Math.abs(currentX - startPosRef.current.x);
    const dy = Math.abs(currentY - startPosRef.current.y);

    if (dx > 10 || dy > 10) {
      clear();
      onCancel?.();
    }
  }, [onCancel]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
    startPosRef.current = null;
  }, []);

  const end = useCallback(() => {
    if (timerRef.current && !isLongPressed) {
      // Short press
      clear();
      onPress?.();
    } else {
      clear();
    }
    setIsLongPressed(false);
  }, [isLongPressed, onPress, clear]);

  const handlers = {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: clear,
  };

  return {
    handlers,
    isPressing,
    isLongPressed,
  };
}
