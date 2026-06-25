/**
 * @deprecated Use shadcn `Card` from `@/components/ui/card` with the
 * `interactive` variant. Will be removed in Phase 10 of the UI unification
 * (`docs/UI_AUDIT.md`).
 *
 * Interactive Card Component
 * Feature: 032-professional-ui
 *
 * Uses GPU-accelerated animations for smooth interactions.
 */

import { forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface InteractiveCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Card content */
  children: ReactNode;
  /** Enable hover lift effect (desktop) */
  hoverLift?: boolean;
  /** Enable press scale effect (mobile) */
  pressScale?: boolean;
  /** Haptic feedback on press */
  haptic?: boolean;
  /** Card variant */
  variant?: "default" | "ghost" | "bordered" | "elevated";
  /** Border radius preset */
  radius?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** Show active/selected state */
  active?: boolean;
  /** Disable all interactions */
  disabled?: boolean;
}

const radiusMap = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-3xl",
};

const paddingMap = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

const variantStyles = {
  default: "bg-card",
  ghost: "bg-transparent hover:bg-muted/50",
  bordered: "bg-card border border-border/40",
  elevated: "bg-card shadow-md hover:shadow-lg",
};

/**
 * InteractiveCard - Professional card with smooth interactions
 *
 * @example
 * <InteractiveCard
 *   variant="bordered"
 *   hoverLift
 *   pressScale
 *   onClick={() => handleClick()}
 * >
 *   <CardContent />
 * </InteractiveCard>
 */
export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(function InteractiveCard(
  {
    children,
    className,
    hoverLift = true,
    pressScale = true,
    haptic = true,
    variant = "default",
    radius = "xl",
    padding = "md",
    active = false,
    disabled = false,
    onClick,
    ...props
  },
  ref,
) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (haptic) {
      triggerHapticFeedback("light");
    }
    onClick?.(e);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative overflow-hidden transition-colors",
        radiusMap[radius],
        paddingMap[padding],
        variantStyles[variant],
        active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        disabled && "opacity-50 pointer-events-none",
        onClick && "cursor-pointer",
        className,
      )}
      whileHover={
        !disabled && hoverLift
          ? {
              y: -2,
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      whileTap={
        !disabled && pressScale
          ? {
              scale: 0.98,
              transition: { duration: 0.1, ease: "easeOut" },
            }
          : undefined
      }
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * InteractiveListItem - List row with interactions
 */
export const InteractiveListItem = forwardRef<HTMLDivElement, InteractiveCardProps>(function InteractiveListItem(
  {
    children,
    className,
    hoverLift = false,
    pressScale = true,
    haptic = true,
    active = false,
    disabled = false,
    onClick,
    ...props
  },
  ref,
) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (haptic) {
      triggerHapticFeedback("light");
    }
    onClick?.(e);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative flex items-center gap-3 p-2 rounded-lg",
        "transition-colors hover:bg-muted/50",
        active && "bg-primary/10",
        disabled && "opacity-50 pointer-events-none",
        onClick && "cursor-pointer",
        className,
      )}
      whileTap={
        !disabled && pressScale
          ? {
              scale: 0.99,
              transition: { duration: 0.1, ease: "easeOut" },
            }
          : undefined
      }
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * InteractiveButton - Enhanced button with animations
 */
interface InteractiveButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const buttonVariantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "bg-transparent hover:bg-muted text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const buttonSizeStyles = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
};

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(function InteractiveButton(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        isDisabled && "opacity-50 pointer-events-none",
        className,
      )}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              transition: { duration: 0.15 },
            }
          : undefined
      }
      whileTap={
        !isDisabled
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : undefined
      }
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </motion.span>
      )}
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {icon && iconPosition === "left" && icon}
        {children}
        {icon && iconPosition === "right" && icon}
      </span>
    </motion.button>
  );
});

export default InteractiveCard;
