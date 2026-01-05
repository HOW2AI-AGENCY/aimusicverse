/**
 * Common animation variants for framer-motion
 *
 * Centralized animation variants to ensure consistency
 * and reduce bundle size per constitution Principle X (Performance Budget).
 *
 * Per research.md Task 3: Skeleton loader consolidation requires
 * centralized motion handling that respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * import { motion } from '@/lib/motion';
 * import { variants } from '@/lib/motion-variants';
 *
 * <motion.div
 *   variants={variants.fadeIn}
 *   initial="hidden"
 *   animate="visible"
 *   exit="hidden"
 * />
 * ```
 */

import { Transition, Variants } from 'framer-motion';

/**
 * Base transition config
 */
export const transition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Fade in/out variants
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Slide up variants
 */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Slide down variants
 */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Scale in/out variants
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

/**
 * Stagger children variants for lists
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Skeleton shimmer variants
 *
 * Per research.md Task 3: Skeleton loading animation
 * with prefers-reduced-motion support
 */
export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      repeatType: 'loop' as const,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

/**
 * Pulse variants for loading indicators
 */
export const pulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      repeatType: 'loop' as const,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Spinner rotation variants
 */
export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      repeatType: 'loop' as const,
      duration: 1,
      ease: 'linear',
    },
  },
};

/**
 * Hover lift effect
 */
export const hoverLift: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
};

/**
 * Press/tap effect
 */
export const pressScale: Variants = {
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
};

/**
 * Drawer/panel slide variants
 */
export const drawerSlide: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
};

/**
 * Modal scale/fade variants
 */
export const modalScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Tab content variants
 */
export const tabContent: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

/**
 * Track card specific variants
 */
export const trackCard: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
};

/**
 * Audio player specific variants
 */
export const playerExpand: Variants = {
  collapsed: {
    height: 80,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  expanded: {
    height: '100vh',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

/**
 * Gesture feedback variants (swipe, like, etc.)
 */
export const gestureFeedback: Variants = {
  idle: { scale: 1, opacity: 1 },
  active: { scale: 1.2, opacity: 0.8 },
};

/**
 * Reduced motion variants
 *
 * For users who prefer reduced motion, disable all animations
 */
export const reducedMotion = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
};

/**
 * Get motion-aware variants
 *
 * Returns normal variants if motion is allowed,
 * or reduced motion variants if user prefers reduced motion
 *
 * @example
 * ```tsx
 * import { usePrefersReducedMotion } from '@/lib/a11y';
 * import { getMotionVariants, scaleIn } from '@/lib/motion-variants';
 *
 * const prefersReduced = usePrefersReducedMotion();
 * const variants = getMotionVariants(scaleIn, prefersReduced);
 * ```
 */
export function getMotionVariants(
  variants: Variants,
  prefersReduced: boolean
): Variants {
  return prefersReduced ? reducedMotion : variants;
}
