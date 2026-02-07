/**
 * AnimatedIcon Component
 * Feature: 032-professional-ui
 * 
 * Icon component with smooth micro-animations for better UX.
 * Supports various animation types and hover interactions.
 */

import * as React from "react";
import { memo, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from '@/lib/motion';
import type { LucideIcon } from "lucide-react";

type AnimationType = 
  | "none" 
  | "bounce" 
  | "pulse" 
  | "spin" 
  | "shake" 
  | "wiggle" 
  | "ping" 
  | "float"
  | "heartbeat";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type IconColor = "default" | "primary" | "generate" | "studio" | "success" | "warning" | "error" | "muted";

interface AnimatedIconProps extends Omit<HTMLMotionProps<"div">, "children"> {
  icon: LucideIcon;
  size?: IconSize;
  animation?: AnimationType;
  color?: IconColor;
  /** Play animation on hover instead of continuously */
  animateOnHover?: boolean;
  /** Scale on hover */
  hoverScale?: boolean;
  /** Custom icon className */
  iconClassName?: string;
}

const sizeClasses: Record<IconSize, { wrapper: string; icon: string }> = {
  xs: { wrapper: "w-3 h-3", icon: "w-3 h-3" },
  sm: { wrapper: "w-4 h-4", icon: "w-4 h-4" },
  md: { wrapper: "w-5 h-5", icon: "w-5 h-5" },
  lg: { wrapper: "w-6 h-6", icon: "w-6 h-6" },
  xl: { wrapper: "w-8 h-8", icon: "w-8 h-8" },
  "2xl": { wrapper: "w-10 h-10", icon: "w-10 h-10" },
};

const colorClasses: Record<IconColor, string> = {
  default: "text-foreground",
  primary: "text-primary",
  generate: "text-generate",
  studio: "text-studio",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-destructive",
  muted: "text-muted-foreground",
};

const getAnimationVariants = (animation: AnimationType) => {
  switch (animation) {
    case "bounce":
      return {
        animate: { y: [0, -4, 0] },
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 },
      };
    case "pulse":
      return {
        animate: { scale: [1, 1.15, 1] },
        transition: { duration: 0.8, repeat: Infinity },
      };
    case "spin":
      return {
        animate: { rotate: 360 },
        transition: { duration: 2, repeat: Infinity, ease: "linear" as const },
      };
    case "shake":
      return {
        animate: { x: [0, -2, 2, -2, 2, 0] },
        transition: { duration: 0.4, repeat: Infinity, repeatDelay: 3 },
      };
    case "wiggle":
      return {
        animate: { rotate: [0, -5, 5, -5, 5, 0] },
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2.5 },
      };
    case "ping":
      return {
        animate: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] },
        transition: { duration: 1, repeat: Infinity },
      };
    case "float":
      return {
        animate: { y: [0, -3, 0] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "heartbeat":
      return {
        animate: { scale: [1, 1.1, 1, 1.1, 1] },
        transition: { duration: 1.2, repeat: Infinity, repeatDelay: 1 },
      };
    default:
      return { animate: {}, transition: {} };
  }
};

const getHoverAnimationVariants = (animation: AnimationType) => {
  switch (animation) {
    case "bounce":
      return { y: [0, -6, 0] };
    case "pulse":
      return { scale: [1, 1.2, 1] };
    case "spin":
      return { rotate: 360 };
    case "shake":
      return { x: [0, -3, 3, -3, 3, 0] };
    case "wiggle":
      return { rotate: [0, -8, 8, -8, 8, 0] };
    case "ping":
      return { scale: 1.2 };
    case "float":
      return { y: -4 };
    case "heartbeat":
      return { scale: [1, 1.15, 1, 1.15, 1] };
    default:
      return {};
  }
};

export const AnimatedIcon = memo(forwardRef<HTMLDivElement, AnimatedIconProps>(
  function AnimatedIcon(
    {
      icon: Icon,
      size = "md",
      animation = "none",
      color = "default",
      animateOnHover = false,
      hoverScale = false,
      className,
      iconClassName,
      onClick,
      ...props
    },
    ref
  ) {
    const sizes = sizeClasses[size];
    const { animate: animateProps, transition } = getAnimationVariants(animation);
    const hoverAnimateProps = getHoverAnimationVariants(animation);

    const isInteractive = Boolean(onClick) || hoverScale || animateOnHover;

    return (
      <motion.div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          sizes.wrapper,
          isInteractive && "cursor-pointer",
          className
        )}
        // Continuous animation (only when not animateOnHover)
        animate={!animateOnHover && animation !== "none" ? animateProps : undefined}
        transition={!animateOnHover ? transition : undefined}
        // Hover animations
        whileHover={
          isInteractive
            ? {
                scale: hoverScale ? 1.1 : 1,
                ...(animateOnHover ? hoverAnimateProps : {}),
              }
            : undefined
        }
        whileTap={isInteractive ? { scale: 0.9 } : undefined}
        onClick={onClick}
        {...props}
      >
        <Icon className={cn(sizes.icon, colorClasses[color], iconClassName)} />
      </motion.div>
    );
  }
));

AnimatedIcon.displayName = "AnimatedIcon";

/**
 * IconButton with consistent styling and animations
 */
interface AnimatedIconButtonProps extends AnimatedIconProps {
  /** Background variant */
  variant?: "ghost" | "muted" | "primary" | "glass";
  /** Rounded style */
  rounded?: "md" | "lg" | "xl" | "full";
  /** Minimum touch target */
  touchTarget?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Aria label for accessibility */
  "aria-label"?: string;
}

const variantStyles: Record<string, string> = {
  ghost: "bg-transparent hover:bg-accent/50 active:bg-accent/70",
  muted: "bg-muted/50 hover:bg-muted active:bg-muted/80",
  primary: "bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary",
  glass: "bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-card/70",
};

const roundedStyles: Record<string, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const AnimatedIconButton = memo(forwardRef<HTMLDivElement, AnimatedIconButtonProps>(
  function AnimatedIconButton(
    {
      variant = "ghost",
      rounded = "lg",
      touchTarget = true,
      disabled = false,
      className,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) {
    return (
      <AnimatedIcon
        ref={ref}
        className={cn(
          "transition-colors duration-150",
          variantStyles[variant],
          roundedStyles[rounded],
          touchTarget && "min-h-[44px] min-w-[44px] p-2",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        hoverScale
        aria-label={ariaLabel}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...props}
      />
    );
  }
));

AnimatedIconButton.displayName = "AnimatedIconButton";

export default AnimatedIcon;
