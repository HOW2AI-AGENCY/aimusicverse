/**
 * ActionCard - Reusable action card with icon, title, description
 * Touch-friendly with proper 44px+ targets for mobile
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { motion } from '@/lib/motion';

interface ActionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  hint?: string;
  variant?: 'default' | 'primary' | 'accent';
  isActive?: boolean;
  isLoading?: boolean;
  badge?: React.ReactNode;
}

const ActionCard = forwardRef<HTMLButtonElement, ActionCardProps>(
  ({ 
    icon, 
    title, 
    description, 
    hint,
    variant = 'default',
    isActive = false,
    isLoading = false,
    badge,
    className, 
    disabled,
    onClick,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles - touch-friendly padding
          'relative w-full min-h-[72px] sm:min-h-[80px] p-3 sm:p-4',
          'flex items-start gap-3 rounded-xl text-left',
          'border transition-all duration-200',
          // Variants
          variant === 'default' && [
            'bg-card border-border/50',
            'hover:border-primary/30 hover:bg-primary/5',
            isActive && 'border-primary bg-primary/5',
          ],
          variant === 'primary' && [
            'bg-primary/10 border-primary/20',
            'hover:border-primary/40 hover:bg-primary/15',
            isActive && 'border-primary bg-primary/20',
          ],
          variant === 'accent' && [
            'bg-accent/10 border-accent/20',
            'hover:border-accent/40 hover:bg-accent/15',
          ],
          // States
          disabled && 'opacity-50 cursor-not-allowed',
          isLoading && 'pointer-events-none',
          className
        )}
        {...props}
      >
        {/* Icon container - 44px minimum touch target */}
        <div className={cn(
          'shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg',
          'flex items-center justify-center',
          variant === 'default' && 'bg-primary/10',
          variant === 'primary' && 'bg-primary/20',
          variant === 'accent' && 'bg-accent/20',
          isLoading && 'animate-pulse'
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm sm:text-base text-foreground truncate">
              {title}
            </span>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {hint && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
              {hint}
            </p>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>
    );
  }
);

ActionCard.displayName = 'ActionCard';

export { ActionCard };
