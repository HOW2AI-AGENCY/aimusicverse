/**
 * Smooth Counter Hook
 * Feature: 032-professional-ui
 *
 * Animates a number counting up for visual feedback.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface SmoothCounterOptions {
  /** Starting value */
  from?: number;
  /** Target value */
  to: number;
  /** Animation duration in ms */
  duration?: number;
  /** Easing function */
  easing?: "linear" | "easeOut" | "easeInOut" | "spring";
  /** Decimal places to show */
  decimals?: number;
  /** Format function for display */
  format?: (value: number) => string;
  /** Start animation immediately */
  autoStart?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

interface SmoothCounterResult {
  /** Current animated value */
  value: number;
  /** Formatted display value */
  displayValue: string;
  /** Whether animation is running */
  isAnimating: boolean;
  /** Start/restart animation */
  start: () => void;
  /** Reset to initial value */
  reset: () => void;
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * useSmoothCounter - Animate numbers smoothly
 *
 * @example
 * const { displayValue } = useSmoothCounter({ to: 1500, duration: 1000 });
 * return <span className="text-2xl font-bold">{displayValue}</span>;
 */
export function useSmoothCounter(options: SmoothCounterOptions): SmoothCounterResult {
  const {
    from = 0,
    to,
    duration = 1000,
    easing = "easeOut",
    decimals = 0,
    format = (v) => v.toLocaleString("ru-RU"),
    autoStart = true,
    onComplete,
  } = options;

  const [value, setValue] = useState(autoStart ? from : to);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunctions[easing](progress);
      const currentValue = from + (to - from) * easedProgress;

      setValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setValue(to);
        setIsAnimating(false);
        onComplete?.();
      }
    },
    [from, to, duration, easing, onComplete],
  );

  const start = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = undefined;
    setValue(from);
    setIsAnimating(true);
    animationRef.current = requestAnimationFrame(animate);
  }, [from, animate]);

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = undefined;
    setValue(from);
    setIsAnimating(false);
  }, [from]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoStart, start]);

  const displayValue = format(Number(value.toFixed(decimals)));

  return {
    value,
    displayValue,
    isAnimating,
    start,
    reset,
  };
}

// Note: AnimatedCounter component moved to src/components/ui/AnimatedCounter.tsx
// for proper JSX handling. This file exports hooks only.

export default useSmoothCounter;
