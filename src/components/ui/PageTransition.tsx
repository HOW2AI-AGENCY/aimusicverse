/**
 * PageTransition - Smooth page transition wrapper
 * Feature: UX Improvements
 *
 * Provides consistent page transitions across routes
 */

import { memo, type ReactNode } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  /** Unique key for transition (usually route path) */
  pageKey?: string;
  /** Transition variant */
  variant?: "fade" | "slide" | "scale" | "none";
  /** Transition direction for slide */
  direction?: "left" | "right" | "up" | "down";
  /** Additional className */
  className?: string;
  /** Duration in seconds */
  duration?: number;
}

const getVariants = (variant: PageTransitionProps["variant"], direction: PageTransitionProps["direction"]) => {
  const offset = 20;

  switch (variant) {
    case "slide":
      const slideOffset = {
        left: { x: offset, y: 0 },
        right: { x: -offset, y: 0 },
        up: { x: 0, y: offset },
        down: { x: 0, y: -offset },
      };
      const initial = slideOffset[direction || "up"];
      return {
        initial: { opacity: 0, ...initial },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, ...initial },
      };

    case "scale":
      return {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
      };

    case "none":
      return {
        initial: {},
        animate: {},
        exit: {},
      };

    case "fade":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

export const PageTransition = memo(function PageTransition({
  children,
  pageKey,
  variant = "fade",
  direction = "up",
  className,
  duration = 0.2,
}: PageTransitionProps) {
  const variants = getVariants(variant, direction);

  return (
    <motion.div
      key={pageKey}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
});

/**
 * AnimatedSection - Section with entrance animation
 */
interface AnimatedSectionProps {
  children: ReactNode;
  /** Delay before animation starts */
  delay?: number;
  /** Additional className */
  className?: string;
  /** Disable animation (for performance) */
  disabled?: boolean;
}

export const AnimatedSection = memo(function AnimatedSection({
  children,
  delay = 0,
  className,
  disabled = false,
}: AnimatedSectionProps) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
});

/**
 * FadeIn - Simple fade in wrapper
 */
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn = memo(function FadeIn({ children, delay = 0, duration = 0.3, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

/**
 * ScaleIn - Scale entrance animation
 */
export const ScaleIn = memo(function ScaleIn({ children, delay = 0, duration = 0.2, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export default PageTransition;
