/**
 * useKnobGestures - Enhanced gesture handling for knob controls
 * Supports double-tap reset, long-press fine mode, and smooth drag
 */

import { useCallback, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';

interface UseKnobGesturesOptions {
  value: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  min?: number;
  max?: number;
  step?: number;
  fineStep?: number;
  sensitivity?: number;
  doubleTapDelay?: number;
}

interface KnobGesturesReturn {
  bind: ReturnType<typeof useGesture>;
  isFineMode: boolean;
  isDragging: boolean;
}

export function useKnobGestures({
  value,
  onChange,
  onReset,
  min = 0,
  max = 1,
  step = 0.01,
  fineStep = 0.001,
  sensitivity = 200, // pixels for full range
  doubleTapDelay = 300,
}: UseKnobGesturesOptions): KnobGesturesReturn {
  const [isFineMode, setIsFineMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const startValue = useRef(value);
  const accumulatedDelta = useRef(0);

  // Clamp value to range
  const clamp = useCallback((v: number) => 
    Math.min(max, Math.max(min, v)), 
    [min, max]
  );

  // Quantize to step
  const quantize = useCallback((v: number, s: number) => 
    Math.round(v / s) * s, 
    []
  );

  // Handle double-tap for reset
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    
    if (timeSinceLastTap < doubleTapDelay) {
      // Double tap detected - reset to center
      onChange(0.5);
      onReset?.();
      lastTapTime.current = 0;
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else {
      lastTapTime.current = now;
    }
  }, [doubleTapDelay, onChange, onReset]);

  // Handle long press for fine mode
  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsFineMode(true);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([5, 50, 5]);
      }
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const bind = useGesture(
    {
      onDragStart: ({ event }) => {
        event?.preventDefault();
        setIsDragging(true);
        startValue.current = value;
        accumulatedDelta.current = 0;
        startLongPress();
      },
      
      onDrag: ({ movement: [, my], memo = startValue.current }) => {
        cancelLongPress();
        
        // Calculate delta based on vertical movement
        const currentStep = isFineMode ? fineStep : step;
        const range = max - min;
        const pixelsPerUnit = sensitivity / range;
        
        // Negative because dragging up should increase
        const delta = -my / pixelsPerUnit;
        const newValue = clamp(quantize(memo + delta, currentStep));
        
        if (newValue !== value) {
          onChange(newValue);
          
          // Light haptic on value change
          if ('vibrate' in navigator && Math.abs(newValue - value) >= step) {
            navigator.vibrate(1);
          }
        }
        
        return memo;
      },
      
      onDragEnd: () => {
        setIsDragging(false);
        setIsFineMode(false);
        cancelLongPress();
      },
      
      onPointerDown: () => {
        handleDoubleTap();
      },
      
      onWheel: ({ delta: [, dy], event }) => {
        event?.preventDefault();
        const currentStep = event?.shiftKey ? fineStep : step;
        const direction = dy > 0 ? -1 : 1;
        const newValue = clamp(value + direction * currentStep);
        onChange(newValue);
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 5,
      },
      wheel: {
        preventDefault: true,
      },
    }
  );

  return {
    bind,
    isFineMode,
    isDragging,
  };
}

// Hook for keyboard control of knobs
export function useKnobKeyboard(
  value: number,
  onChange: (value: number) => void,
  options: { step?: number; fineStep?: number } = {}
) {
  const { step = 0.05, fineStep = 0.01 } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentStep = e.shiftKey ? fineStep : step;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        e.preventDefault();
        onChange(Math.min(1, value + currentStep));
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        e.preventDefault();
        onChange(Math.max(0, value - currentStep));
        break;
      case 'Home':
        e.preventDefault();
        onChange(0);
        break;
      case 'End':
        e.preventDefault();
        onChange(1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onChange(0.5); // Reset to center
        break;
    }
  }, [value, onChange, step, fineStep]);

  return { onKeyDown: handleKeyDown };
}
