/**
 * TaskProgress - Universal progress indicator component
 * Supports linear, circular, and steps variants with consistent states
 */

import { memo, ReactNode } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, CheckCircle2, XCircle, AlertCircle,
  Play, ExternalLink, RotateCcw, X, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

// Task status types
export type TaskStatus = 'idle' | 'pending' | 'active' | 'success' | 'error' | 'warning';

// Step definition for steps variant
export interface TaskStep {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TaskProgressProps {
  // Core props
  status: TaskStatus;
  progress?: number; // 0-100, optional for indeterminate
  message?: string;
  error?: string | null;
  
  // Display variants
  variant?: 'linear' | 'circular' | 'steps' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  
  // Steps variant props
  steps?: TaskStep[];
  currentStepIndex?: number;
  
  // Count-based progress (e.g., loading stems)
  totalCount?: number;
  completedCount?: number;
  
  // Actions
  onRetry?: () => void;
  onDismiss?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: LucideIcon;
  
  // Custom content
  children?: ReactNode;
  className?: string;
}

// Status icon mapping
const STATUS_ICONS: Record<TaskStatus, LucideIcon | null> = {
  idle: null,
  pending: Loader2,
  active: Loader2,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
};

// Status color mapping
const STATUS_COLORS: Record<TaskStatus, string> = {
  idle: '',
  pending: 'text-muted-foreground',
  active: 'text-primary',
  success: 'text-green-500',
  error: 'text-destructive',
  warning: 'text-yellow-500',
};

const STATUS_BG: Record<TaskStatus, string> = {
  idle: '',
  pending: 'border-muted bg-muted/20',
  active: 'border-primary/50 bg-primary/5',
  success: 'border-green-500/50 bg-green-500/10',
  error: 'border-destructive/50 bg-destructive/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
};

// Size configurations
const SIZE_CONFIG = {
  sm: { icon: 'w-3.5 h-3.5', text: 'text-xs', padding: 'p-2', gap: 'gap-1.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', padding: 'p-3', gap: 'gap-2' },
  lg: { icon: 'w-5 h-5', text: 'text-base', padding: 'p-4', gap: 'gap-3' },
};

// Inline variant - compact single line
const InlineProgress = memo(function InlineProgress({
  status,
  message,
  size = 'sm',
  className,
}: Pick<TaskProgressProps, 'status' | 'message' | 'size' | 'className'>) {
  const Icon = STATUS_ICONS[status];
  const config = SIZE_CONFIG[size];
  
  if (status === 'idle' || !Icon) return null;
  
  return (
    <span className={cn(
      'inline-flex items-center',
      config.gap,
      config.text,
      STATUS_COLORS[status],
      className
    )}>
      <Icon className={cn(
        config.icon,
        (status === 'active' || status === 'pending') && 'animate-spin'
      )} />
      {message && <span>{message}</span>}
    </span>
  );
});

// Circular variant - ring progress
const CircularProgress = memo(function CircularProgress({
  status,
  progress = 0,
  size = 'md',
  className,
}: Pick<TaskProgressProps, 'status' | 'progress' | 'size' | 'className'>) {
  const sizeMap = { sm: 32, md: 48, lg: 64 };
  const strokeWidth = size === 'sm' ? 3 : 4;
  const diameter = sizeMap[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const Icon = STATUS_ICONS[status];
  const iconSize = SIZE_CONFIG[size].icon;
  
  return (
    <div className={cn('relative', className)} style={{ width: diameter, height: diameter }}>
      {/* Background circle */}
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${diameter} ${diameter}`}>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress arc */}
        {status === 'active' && (
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-300"
          />
        )}
      </svg>
      
      {/* Center icon or percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Icon ? (
          <Icon className={cn(
            iconSize,
            STATUS_COLORS[status],
            (status === 'active' || status === 'pending') && 'animate-spin'
          )} />
        ) : (
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
});

// Steps variant - multi-step progress
const StepsProgress = memo(function StepsProgress({
  steps = [],
  currentStepIndex = 0,
  status,
  size = 'md',
  className,
}: Pick<TaskProgressProps, 'steps' | 'currentStepIndex' | 'status' | 'size' | 'className'>) {
  const config = SIZE_CONFIG[size];
  
  return (
    <div className={cn('flex items-center', config.gap, className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const StepIcon = step.icon;
        
        let stepStatus: TaskStatus = 'idle';
        if (isCompleted) stepStatus = 'success';
        else if (isCurrent) stepStatus = status === 'error' ? 'error' : 'active';
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className={cn(
              'flex items-center justify-center rounded-full border-2 transition-colors',
              size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10',
              isCompleted && 'border-green-500 bg-green-500 text-white',
              isCurrent && status !== 'error' && 'border-primary bg-primary/10 text-primary',
              isCurrent && status === 'error' && 'border-destructive bg-destructive/10 text-destructive',
              !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
            )}>
              {isCompleted ? (
                <CheckCircle2 className={config.icon} />
              ) : isCurrent && status === 'active' ? (
                <Loader2 className={cn(config.icon, 'animate-spin')} />
              ) : StepIcon ? (
                <StepIcon className={config.icon} />
              ) : (
                <span className={config.text}>{index + 1}</span>
              )}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                'h-0.5 transition-colors',
                size === 'sm' ? 'w-4' : size === 'md' ? 'w-8' : 'w-12',
                isCompleted ? 'bg-green-500' : 'bg-muted'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
});

// Linear variant - default progress bar
const LinearProgress = memo(function LinearProgress({
  status,
  progress = 0,
  message,
  error,
  totalCount,
  completedCount,
  size = 'md',
  onRetry,
  onDismiss,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionIcon: PrimaryIcon,
  children,
  className,
}: Omit<TaskProgressProps, 'variant' | 'steps' | 'currentStepIndex'>) {
  const config = SIZE_CONFIG[size];
  const Icon = STATUS_ICONS[status];
  const isActive = status === 'active' || status === 'pending';
  
  if (status === 'idle') return null;
  
  // Build message with count if provided
  let displayMessage = message;
  if (totalCount !== undefined && completedCount !== undefined) {
    displayMessage = `${message || 'Загрузка'} (${completedCount}/${totalCount})`;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-lg border',
          config.padding,
          STATUS_BG[status],
          className
        )}
      >
        <div className={cn('flex items-start', config.gap)}>
          {/* Status Icon */}
          {Icon && (
            <div className="flex-shrink-0 mt-0.5">
              <Icon className={cn(
                config.icon,
                STATUS_COLORS[status],
                isActive && 'animate-spin'
              )} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className={cn('font-medium truncate', config.text)}>
                {displayMessage}
              </p>
              {isActive && progress !== undefined && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {Math.round(progress)}%
                </Badge>
              )}
            </div>

            {/* Progress bar for active states */}
            {isActive && (
              <Progress 
                value={progress} 
                className={cn('mt-2', size === 'sm' ? 'h-1' : 'h-2')} 
              />
            )}

            {/* Error message */}
            {status === 'error' && error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {/* Custom content */}
            {children}

            {/* Action buttons */}
            {(onPrimaryAction || onRetry || onDismiss) && (
              <div className="flex items-center gap-2 mt-3">
                {status === 'success' && onPrimaryAction && (
                  <Button size="sm" onClick={onPrimaryAction} className="gap-1">
                    {PrimaryIcon && <PrimaryIcon className="w-3 h-3" />}
                    {primaryActionLabel || 'Открыть'}
                  </Button>
                )}
                
                {status === 'error' && onRetry && (
                  <Button size="sm" variant="outline" onClick={onRetry} className="gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Повторить
                  </Button>
                )}
                
                {onDismiss && (status === 'success' || status === 'error') && (
                  <Button size="sm" variant="ghost" onClick={onDismiss} className="gap-1">
                    <X className="w-3 h-3" />
                    Закрыть
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

// Main component
export const TaskProgress = memo(function TaskProgress({
  variant = 'linear',
  ...props
}: TaskProgressProps) {
  switch (variant) {
    case 'inline':
      return <InlineProgress {...props} />;
    case 'circular':
      return <CircularProgress {...props} />;
    case 'steps':
      return <StepsProgress {...props} />;
    case 'linear':
    default:
      return <LinearProgress {...props} />;
  }
});

// Named exports for direct usage
export { InlineProgress, CircularProgress, StepsProgress, LinearProgress };
