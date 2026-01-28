/**
 * EmptyState - Unified empty state component
 * Replaces scattered empty state patterns with consistent design
 */

import { memo, ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { emptyStates } from '@/lib/design-tokens';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
  /** Show compact version for inline use */
  compact?: boolean;
  /** Animate entrance */
  animate?: boolean;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
  compact = false,
  animate = true,
}: EmptyStateProps) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};
  
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        emptyStates.container,
        compact && 'py-6',
        className
      )}
    >
      <div className={cn(
        emptyStates.icon,
        compact && 'w-12 h-12 mb-3'
      )}>
        <Icon className={cn('w-8 h-8 text-muted-foreground', compact && 'w-6 h-6')} />
      </div>
      
      <h3 className={cn(emptyStates.title, compact && 'text-base mb-1')}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(emptyStates.description, compact && 'mb-4')}>
          {description}
        </p>
      )}
      
      {children}
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'default'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Wrapper>
  );
});

export default EmptyState;
