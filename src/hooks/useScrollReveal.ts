/**
 * Scroll Reveal Hook
 * Feature: 032-professional-ui
 *
 * Efficiently reveals elements as they enter the viewport.
 * Uses IntersectionObserver for optimal scroll performance.
 */

import { useRef, useState, useEffect, useCallback, RefObject } from "react";

interface ScrollRevealOptions {
  /** Threshold for triggering reveal (0-1) */
  threshold?: number;
  /** Root margin for early/late triggering */
  rootMargin?: string;
  /** Only reveal once (default: true) */
  once?: boolean;
  /** Delay before marking as revealed (ms) */
  delay?: number;
  /** Disable on reduced motion preference */
  respectReducedMotion?: boolean;
}

interface ScrollRevealResult {
  ref: RefObject<HTMLDivElement | null>;
  isRevealed: boolean;
  /** Force reveal (useful for conditional animations) */
  reveal: () => void;
}

/**
 * useScrollReveal - Detect when an element enters the viewport
 *
 * @example
 * const { ref, isRevealed } = useScrollReveal({ threshold: 0.2 });
 *
 * <div ref={ref} className={cn(
 *   'transition-all duration-500',
 *   isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
 * )}>
 *   Content
 * </div>
 */
export function useScrollReveal(options: ScrollRevealOptions = {}): ScrollRevealResult {
  const {
    threshold = 0.1,
    rootMargin = "0px 0px -50px 0px",
    once = true,
    delay = 0,
    respectReducedMotion = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const reveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  useEffect(() => {
    // If reduced motion is preferred and we respect it, reveal immediately
    if (respectReducedMotion && prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setIsRevealed(true), delay);
            } else {
              setIsRevealed(true);
            }

            if (once) {
              observer.unobserve(element);
            }
          } else if (!once) {
            setIsRevealed(false);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, delay, respectReducedMotion, prefersReducedMotion]);

  return { ref, isRevealed, reveal };
}

/**
 * useStaggeredReveal - Reveal multiple elements with staggered timing
 *
 * @example
 * const { containerRef, getItemProps } = useStaggeredReveal({ stagger: 50 });
 *
 * <div ref={containerRef}>
 *   {items.map((item, index) => (
 *     <div key={item.id} {...getItemProps(index)}>
 *       {item.content}
 *     </div>
 *   ))}
 * </div>
 */
export function useStaggeredReveal(
  options: {
    stagger?: number;
    threshold?: number;
    once?: boolean;
  } = {},
) {
  const { stagger = 50, threshold = 0.1, once = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContainerVisible, setIsContainerVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContainerVisible(true);
            if (once) observer.unobserve(element);
          } else if (!once) {
            setIsContainerVisible(false);
          }
        });
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);

  const getItemProps = useCallback(
    (index: number) => ({
      style: {
        opacity: isContainerVisible ? 1 : 0,
        transform: isContainerVisible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.3s ease ${index * stagger}ms, transform 0.3s ease ${index * stagger}ms`,
      },
    }),
    [isContainerVisible, stagger],
  );

  return { containerRef, isContainerVisible, getItemProps };
}

export default useScrollReveal;
