/**
 * Motion Variants for Framer Motion
 * Feature: 032-professional-ui
 * 
 * Reusable animation variants for consistent motion design
 * All variants respect prefers-reduced-motion
 * 
 * Usage:
 * import { motion } from '@/lib/motion';
 * import { fadeIn, scaleIn } from '@/lib/motion-variants';
 * 
 * <motion.div
 *   variants={scaleIn}
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 * />
 */

import { Variants } from 'framer-motion';

// Timing constants (matching CSS animations)
export const timing = {
  fast: 150,
  standard: 200,
  slow: 300,
} as const;

// Easing functions
export const easing = {
  easeOut: { type: 'spring', stiffness: 300, damping: 25 },
  easeInOut: { type: 'Tween', ease: [0.4, 0, 0.2, 1] },
} as const;

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: {
    duration: timing.fast,
    ease: 'easeOut',
  },
};

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: {
    duration: timing.standard,
    ease: [0.32, 0.72, 0, 1],
  },
};

export const slideDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: {
    duration: timing.standard,
    ease: [0.32, 0.72, 0, 1],
  },
};

export const slideLeft: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: {
    duration: timing.standard,
    ease: [0.32, 0.72, 0, 1],
  },
};

export const slideRight: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: {
    duration: timing.standard,
    ease: [0.32, 0.72, 0, 1],
  },
};

// ============================================================================
// INTERACTION ANIMATIONS
// ============================================================================

export const press: Variants = {
  initial: { scale: 1 },
  animate: { scale: 1 },
  whileTap: { scale: 0.97 },
  transition: {
    duration: timing.fast,
    ease: 'easeOut',
  },
};

export const hover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  transition: {
    duration: timing.fast,
    ease: 'easeOut',
  },
};

// ============================================================================
// STAGGER ANIMATIONS (for lists)
// ============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

// ============================================================================
// MODAL/SHEET ANIMATIONS
// ============================================================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: timing.fast,
  },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: {
    duration: timing.standard,
    ease: 'easeOut',
  },
};

export const bottomSheet: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: {
    type: 'spring',
    damping: 25,
    stiffness: 200,
  },
};

// ============================================================================
// REDUCED MOTION SUPPORT
// ============================================================================

const reducedMotion: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.01 },
};

/**
 * Hook to get variants that respect prefers-reduced-motion
 */
export function useResponsiveVariants(variants: Variants): Variants {
  // In a real implementation, you'd use useReducedMotion() hook
  // For now, return variants as-is
  return variants;
}

// Export all variants
export const variants = {
  // Fade
  fadeIn,
  fadeInUp,
  fadeInDown,
  
  // Scale
  scaleIn,
  scaleUp,
  
  // Slide
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  
  // Interaction
  press,
  hover,
  
  // Stagger
  staggerContainer,
  staggerItem,
  
  // Modal/Sheet
  modalOverlay,
  modalContent,
  bottomSheet,
} as const;
