/**
 * Optimized framer-motion exports
 * Import from this file instead of 'framer-motion' directly for better tree-shaking
 * 
 * Usage: import { motion, AnimatePresence, fadeIn } from '@/lib/motion';
 */

// Core components - most commonly used
export { 
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useDragControls,
  useScroll,
  useInView,
  useReducedMotion,
  useAnimationFrame,
  animate,
  stagger,
  Reorder,
} from 'framer-motion';

// Types
export type { 
  Variants,
  Transition,
  MotionProps,
  HTMLMotionProps,
  PanInfo,
  MotionValue,
  SpringOptions,
  Target,
  TargetAndTransition,
  Easing,
} from 'framer-motion';

// Common animation presets for consistency
export const fadeIn: import('framer-motion').Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: import('framer-motion').Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideDown: import('framer-motion').Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideInFromRight: import('framer-motion').Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInFromLeft: import('framer-motion').Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn: import('framer-motion').Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleUp: import('framer-motion').Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const staggerContainer: import('framer-motion').Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: import('framer-motion').Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Pulse animation for attention
export const pulse: import('framer-motion').Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2 }
  },
};

// Shake animation for errors
export const shake: import('framer-motion').Variants = {
  initial: { x: 0 },
  animate: { 
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  },
};

// Common transition presets
export const springTransition: import('framer-motion').Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: import('framer-motion').Transition = {
  duration: 0.2,
  ease: 'easeInOut',
};

export const quickTransition: import('framer-motion').Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

export const slowTransition: import('framer-motion').Transition = {
  duration: 0.4,
  ease: 'easeInOut',
};

// Reduced motion safe variants
export function getReducedMotionVariants(
  variants: import('framer-motion').Variants,
  prefersReducedMotion: boolean
): import('framer-motion').Variants {
  if (!prefersReducedMotion) return variants;
  
  // Return instant variants for reduced motion
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
}

// Animation presets that respect reduced motion
export function useAnimationPresets() {
  // Import useReducedMotion from framer-motion
  const { useReducedMotion: useReducedMotionHook } = require('framer-motion');
  const prefersReducedMotion = useReducedMotionHook();
  
  return {
    fadeIn: getReducedMotionVariants(fadeIn, !!prefersReducedMotion),
    slideUp: getReducedMotionVariants(slideUp, !!prefersReducedMotion),
    scaleIn: getReducedMotionVariants(scaleIn, !!prefersReducedMotion),
    staggerContainer: prefersReducedMotion ? {} : staggerContainer,
    staggerItem: getReducedMotionVariants(staggerItem, !!prefersReducedMotion),
    transition: prefersReducedMotion ? { duration: 0 } : smoothTransition,
  };
}
