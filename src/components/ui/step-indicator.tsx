/**
 * StepIndicator - Visual step progress indicator
 * Shows current step in a multi-step workflow
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: 'dots' | 'numbers' | 'labels';
  size?: 'sm' | 'md';
}

export function StepIndicator({
  steps,
  currentStep,
  className,
  variant = 'dots',
  size = 'md',
}: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {variant === 'dots' && (
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={step.id}
                className={cn(
                  'rounded-full transition-all duration-300',
                  size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
                  isCompleted && 'bg-primary',
                  isCurrent && 'bg-primary scale-125',
                  !isCompleted && !isCurrent && 'bg-muted-foreground/30'
                )}
              />
            );
          })}
        </div>
      )}

      {variant === 'numbers' && (
        <div className="flex items-center gap-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full text-xs font-medium transition-all',
                    size === 'sm' ? 'w-6 h-6' : 'w-7 h-7',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      'h-0.5 transition-colors',
                      size === 'sm' ? 'w-4' : 'w-6',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {variant === 'labels' && (
        <div className="flex items-center gap-3">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full transition-all',
                    size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      'h-0.5 w-8',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact step indicator for headers
 */
export function StepIndicatorCompact({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  return (
    <span className={cn(
      'text-xs text-muted-foreground tabular-nums',
      className
    )}>
      {current}/{total}
    </span>
  );
}
