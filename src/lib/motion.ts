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
} from 'framer-motion';

// Types
export type { 
  Variants,
  Transition,
  MotionProps,
  PanInfo,
  MotionValue,
  SpringOptions,
  Target,
  TargetAndTransition,
} from '@/lib/motion';

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

export const slideInFromRight: import('framer-motion').Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scaleIn: import('framer-motion').Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
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
