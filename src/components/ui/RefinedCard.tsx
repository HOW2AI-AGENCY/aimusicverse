/**
 * @deprecated Use shadcn `Card` from `@/components/ui/card` with the
 * `surface` / `glass` / `interactive` variant where needed.
 * Kept temporarily for backwards compatibility — will be removed in Phase 10
 * of the UI unification (`docs/UI_AUDIT.md`).
 *
 * Refined Card Component
 * Feature: 032-professional-ui
 */

import React, { forwardRef, ReactNode, HTMLAttributes, memo } from "react";
import { motion, HTMLMotionProps } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { glass, glassSurface, gradientGlass } from "@/lib/glass";
import { hapticPatterns } from "@/components/telegram/TelegramHaptics";

type CardVariant = "default" | "elevated" | "outlined" | "filled" | "glass" | "gradient" | "subtle" | "interactive";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardRounded = "md" | "lg" | "xl" | "2xl";

interface RefinedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  rounded?: CardRounded;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  glow?: boolean;
  haptic?: boolean;
  /** Hover lift effect */
  hoverLift?: boolean;
  /** Hover scale effect */
  hoverScale?: boolean;
  /** Animate entrance */
  animate?: boolean;
  /** Stagger index for animation delay */
  staggerIndex?: number;
}

const variantStyles: Record<CardVariant, string> = {
  default: cn("bg-card border border-border/50", "shadow-elevation-1"),
  elevated: cn(glass.elevated),
  outlined: cn("bg-transparent border-2 border-border"),
  filled: cn("bg-muted border border-transparent"),
  glass: glass.card,
  gradient: cn("bg-gradient-to-br from-card via-card to-primary/5", "border border-border/50"),
  subtle: glass.subtle,
  interactive: glassSurface.interactive,
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-2.5 sm:p-3",
  md: "p-3 sm:p-4",
  lg: "p-4 sm:p-6",
};

const roundedStyles: Record<CardRounded, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

export const RefinedCard = memo(
  forwardRef<HTMLDivElement, RefinedCardProps>(
    (
      {
        children,
        variant = "default",
        padding = "md",
        rounded = "xl",
        interactive = false,
        selected = false,
        disabled = false,
        glow = false,
        haptic = true,
        hoverLift = false,
        hoverScale = false,
        animate = false,
        staggerIndex = 0,
        className,
        onClick,
        ...props
      },
      ref,
    ) => {
      const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;

        if (haptic && interactive) {
          hapticPatterns.itemSelect();
        }

        onClick?.(e);
      };

      const isInteractive = interactive || !!onClick;

      // Animation config
      const animationProps = animate
        ? {
            initial: { opacity: 0, y: 10, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: {
              delay: staggerIndex * 0.05,
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1] as const,
            },
          }
        : {};

      // Hover animation
      const hoverAnimation =
        (hoverLift || hoverScale || isInteractive) && !disabled
          ? {
              whileHover: {
                y: hoverLift ? -2 : isInteractive ? -1 : 0,
                scale: hoverScale ? 1.01 : 1,
              },
            }
          : {};

      // Tap animation
      const tapAnimation = isInteractive && !disabled ? { whileTap: { scale: 0.98 } } : {};

      return (
        <motion.div
          ref={ref}
          onClick={handleClick}
          className={cn(
            roundedStyles[rounded],
            "transition-all duration-200",
            variantStyles[variant],
            paddingStyles[padding],
            isInteractive &&
              !disabled &&
              cn("cursor-pointer", "hover:border-primary/30", "hover:shadow-lg hover:shadow-primary/5"),
            selected && cn("ring-2 ring-primary ring-offset-2 ring-offset-background", "border-primary/50"),
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            glow && "hover:ring-1 hover:ring-primary/20",
            className,
          )}
          {...animationProps}
          {...hoverAnimation}
          {...tapAnimation}
          {...props}
        >
          {children}
        </motion.div>
      );
    },
  ),
);

RefinedCard.displayName = "RefinedCard";

/**
 * Card Header
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>}
        <div>
          <h3 className="text-h4 font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-body-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Card Content
 */
export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 pt-4 border-t border-border/50", "flex items-center justify-end gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Feature Card - Card with icon and description
 */
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: CardVariant;
  onClick?: () => void;
}

export const FeatureCard = memo(function FeatureCard({
  icon,
  title,
  description,
  action,
  variant = "glass",
  onClick,
}: FeatureCardProps) {
  return (
    <RefinedCard variant={variant} interactive={!!onClick} onClick={onClick} hoverLift className="group">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 p-2.5 rounded-xl",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary/15 transition-colors",
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-h5 font-semibold text-foreground">{title}</h3>
          <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </RefinedCard>
  );
});

/**
 * Stat Card - Card for displaying statistics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon?: ReactNode;
  iconColor?: "primary" | "success" | "warning" | "error" | "muted";
  variant?: CardVariant;
  animate?: boolean;
  staggerIndex?: number;
}

const iconColorStyles = {
  primary: {
    bg: "bg-primary/15",
    text: "text-primary",
    border: "border-primary/20",
  },
  success: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  error: {
    bg: "bg-destructive/15",
    text: "text-destructive",
    border: "border-destructive/20",
  },
  muted: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border/50",
  },
};

export const StatCard = memo(function StatCard({
  label,
  value,
  change,
  icon,
  iconColor = "primary",
  variant = "glass",
  animate = false,
  staggerIndex = 0,
}: StatCardProps) {
  const trendColors = {
    up: "text-emerald-400",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  const colors = iconColorStyles[iconColor];

  return (
    <RefinedCard
      variant={variant}
      padding="md"
      animate={animate}
      staggerIndex={staggerIndex}
      hoverLift
      className={cn("border", colors.border)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
          {change && (
            <p className={cn("text-caption mt-1 tabular-nums", trendColors[change.trend])}>
              {change.trend === "up" && "+"}
              {change.value}%
            </p>
          )}
        </div>
        {icon && <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>{icon}</div>}
      </div>
    </RefinedCard>
  );
});

export default RefinedCard;
