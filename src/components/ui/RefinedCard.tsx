/**
 * Refined Card Component
 * Feature: 032-professional-ui
 * 
 * Enhanced card with hover states, variants, and polish
 */

import React, { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { hapticPatterns } from '@/components/telegram/TelegramHaptics';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass' | 'gradient';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface RefinedCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  glow?: boolean;
  haptic?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: cn(
    "bg-card border border-border",
    "shadow-sm"
  ),
  elevated: cn(
    "bg-card border border-border/50",
    "shadow-lg shadow-black/5"
  ),
  outlined: cn(
    "bg-transparent border-2 border-border"
  ),
  filled: cn(
    "bg-muted border border-transparent"
  ),
  glass: cn(
    "bg-background/60 backdrop-blur-xl",
    "border border-white/10",
    "shadow-xl shadow-black/10"
  ),
  gradient: cn(
    "bg-gradient-to-br from-card via-card to-primary/5",
    "border border-border/50"
  ),
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const RefinedCard = forwardRef<HTMLDivElement, RefinedCardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    interactive = false,
    selected = false,
    disabled = false,
    glow = false,
    haptic = true,
    className,
    onClick,
    ...props
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      if (haptic && interactive) {
        hapticPatterns.itemSelect();
      }
      
      onClick?.(e);
    };

    return (
      <motion.div
        ref={ref}
        whileHover={interactive && !disabled ? { y: -2 } : {}}
        whileTap={interactive && !disabled ? { scale: 0.99 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={handleClick}
        className={cn(
          "rounded-xl transition-all duration-200",
          variantStyles[variant],
          paddingStyles[padding],
          interactive && !disabled && cn(
            "cursor-pointer",
            "hover:border-primary/30",
            "hover:shadow-lg hover:shadow-primary/5"
          ),
          selected && cn(
            "ring-2 ring-primary ring-offset-2 ring-offset-background",
            "border-primary"
          ),
          disabled && "opacity-50 cursor-not-allowed",
          glow && "hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

RefinedCard.displayName = 'RefinedCard';

/**
 * Card Header
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div 
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="shrink-0 mt-0.5 text-muted-foreground">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}

/**
 * Card Content
 */
export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "mt-4 pt-4 border-t border-border",
        "flex items-center justify-end gap-2",
        className
      )} 
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

export function FeatureCard({
  icon,
  title,
  description,
  action,
  variant = 'default',
  onClick,
}: FeatureCardProps) {
  return (
    <RefinedCard
      variant={variant}
      interactive={!!onClick}
      onClick={onClick}
      className="group"
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "shrink-0 p-2.5 rounded-xl",
          "bg-primary/10 text-primary",
          "group-hover:bg-primary/15 transition-colors"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </RefinedCard>
  );
}

/**
 * Stat Card - Card for displaying statistics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  variant?: CardVariant;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  variant = 'default',
}: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <RefinedCard variant={variant} padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p className={cn("text-sm mt-1", trendColors[change.trend])}>
              {change.trend === 'up' && '+'}
              {change.value}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </RefinedCard>
  );
}

export default RefinedCard;
