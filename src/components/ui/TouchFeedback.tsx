/**
 * TouchFeedback - Enhanced touch interaction wrapper
 * Feature: UX Improvements
 *
 * Provides consistent haptic feedback, press animations, and accessibility
 */

import { forwardRef, useCallback, type ReactNode } from "react";
import { motion, type MotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptic";

interface TouchFeedbackProps extends Omit<MotionProps, "children"> {
  children: ReactNode;
  /** Haptic feedback intensity */
  haptic?: "light" | "medium" | "heavy" | false;
  /** Press scale factor (0.9-1.0) */
  pressScale?: number;
  /** Enable hover lift effect */
  hoverLift?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** onClick handler */
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  /** Accessible label */
  "aria-label"?: string;
}

export const TouchFeedback = forwardRef<HTMLDivElement, TouchFeedbackProps>(
  (
    {
      children,
      haptic = "light",
      pressScale = 0.97,
      hoverLift = false,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const handleTap = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;

        if (haptic) {
          hapticImpact(haptic);
        }

        onClick?.(e);
      },
      [haptic, disabled, onClick],
    );

    return (
      <motion.div
        ref={ref}
        className={cn(
          "touch-target cursor-pointer select-none",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        whileTap={disabled ? undefined : { scale: pressScale }}
        whileHover={hoverLift && !disabled ? { y: -2, transition: { duration: 0.2 } } : undefined}
        transition={{ duration: 0.1, ease: "easeOut" }}
        onClick={handleTap}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

TouchFeedback.displayName = "TouchFeedback";

/**
 * Pressable Card - Card with touch feedback
 */
interface PressableCardProps extends TouchFeedbackProps {
  variant?: "default" | "glass" | "elevated";
  selected?: boolean;
}

export const PressableCard = forwardRef<HTMLDivElement, PressableCardProps>(
  ({ variant = "default", selected, className, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-card border border-border/50 rounded-xl",
      glass: "bg-card/60 backdrop-blur-md border border-border/40 rounded-xl",
      elevated: "bg-card border border-border/40 rounded-xl shadow-md",
    };

    return (
      <TouchFeedback
        ref={ref}
        className={cn(
          variantClasses[variant],
          "transition-all duration-200",
          selected && "border-primary ring-2 ring-primary/20",
          className,
        )}
        hoverLift={!selected}
        {...props}
      >
        {children}
      </TouchFeedback>
    );
  },
);

PressableCard.displayName = "PressableCard";

/**
 * Icon Button with touch feedback
 */
interface IconTouchButtonProps extends Omit<TouchFeedbackProps, "children"> {
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "primary";
}

export const IconTouchButton = forwardRef<HTMLDivElement, IconTouchButtonProps>(
  ({ icon, size = "md", variant = "default", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-9 h-9",
      md: "w-11 h-11",
      lg: "w-14 h-14",
    };

    const variantClasses = {
      default: "bg-muted/50 hover:bg-muted text-foreground",
      ghost: "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
      primary: "bg-primary/10 hover:bg-primary/20 text-primary",
    };

    return (
      <TouchFeedback
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center transition-colors",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        pressScale={0.9}
        {...props}
      >
        {icon}
      </TouchFeedback>
    );
  },
);

IconTouchButton.displayName = "IconTouchButton";

export default TouchFeedback;
