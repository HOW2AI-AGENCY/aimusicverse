/**
 * @deprecated Use shadcn `Button` from `@/components/ui/button` with the
 * `premium` / `glass` / `icon-sm` variant where needed.
 * Kept temporarily for backwards compatibility — will be removed in Phase 10
 * of the UI unification (`docs/UI_AUDIT.md`).
 *
 * Refined Button Component
 * Feature: 032-professional-ui
 */

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { hapticPatterns } from '@/components/telegram/TelegramHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'premium';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface RefinedButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  glow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-primary text-primary-foreground",
    "hover:bg-primary/90",
    "shadow-sm hover:shadow-md",
    "border border-primary/20"
  ),
  secondary: cn(
    "bg-secondary text-secondary-foreground",
    "hover:bg-secondary/80",
    "border border-secondary/20"
  ),
  outline: cn(
    "bg-transparent text-foreground",
    "border border-border",
    "hover:bg-accent hover:border-primary/30"
  ),
  ghost: cn(
    "bg-transparent text-foreground",
    "hover:bg-accent"
  ),
  destructive: cn(
    "bg-destructive text-destructive-foreground",
    "hover:bg-destructive/90",
    "shadow-sm"
  ),
  success: cn(
    "bg-success text-white",
    "hover:bg-success/90",
    "shadow-sm"
  ),
  premium: cn(
    "bg-gradient-to-r from-primary via-primary/90 to-primary",
    "text-primary-foreground",
    "shadow-lg shadow-primary/25",
    "hover:shadow-xl hover:shadow-primary/30",
    "border border-primary/30"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-xs gap-1 rounded-md",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
  xl: "h-14 px-8 text-lg gap-3 rounded-xl",
};

export const RefinedButton = forwardRef<HTMLButtonElement, RefinedButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    haptic = true,
    glow = false,
    className,
    onClick,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      
      if (haptic) {
        if (variant === 'primary' || variant === 'premium') {
          hapticPatterns.primaryAction();
        } else if (variant === 'destructive') {
          hapticPatterns.error();
        } else {
          hapticPatterns.secondaryAction();
        }
      }
      
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.01 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center",
          "font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "btn-micro",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          glow && variant === 'primary' && "hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin absolute" />
        )}
        
        {/* Content */}
        <span className={cn(
          "inline-flex items-center gap-inherit",
          loading && "opacity-0"
        )}>
          {icon && iconPosition === 'left' && (
            <span className="shrink-0">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="shrink-0">{icon}</span>
          )}
        </span>
      </motion.button>
    );
  }
);

RefinedButton.displayName = 'RefinedButton';

/**
 * Icon Button - Circular button for icons only
 */
interface IconButtonProps extends Omit<RefinedButtonProps, 'children'> {
  icon: ReactNode;
  label: string; // For accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', className, ...props }, ref) => {
    const iconSizes: Record<ButtonSize, string> = {
      xs: "w-7 h-7",
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-14 h-14",
    };

    return (
      <RefinedButton
        ref={ref}
        size={size}
        aria-label={label}
        className={cn(
          "!p-0 rounded-full",
          iconSizes[size],
          className
        )}
        {...props}
      >
        {icon}
      </RefinedButton>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Button Group - For related actions
 */
interface ButtonGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  attached = false,
  className,
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === 'vertical' ? "flex-col" : "flex-row",
        attached ? "gap-0" : "gap-2",
        attached && orientation === 'horizontal' && "[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none",
        attached && orientation === 'vertical' && "[&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none [&>*:not(:first-child):not(:last-child)]:rounded-none",
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}

export default RefinedButton;
