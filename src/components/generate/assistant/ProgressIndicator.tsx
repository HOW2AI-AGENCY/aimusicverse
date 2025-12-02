import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
  className,
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn('hidden md:block', className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted || isCurrent;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                index !== steps.length - 1 && 'pr-8 sm:pr-12'
              )}
            >
              {/* Progress Line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2 transition-all',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ width: 'calc(100% - 2rem)' }}
                  aria-hidden="true"
                />
              )}

              {/* Step Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  'group relative flex flex-col items-center transition-all',
                  isClickable && 'cursor-pointer hover:scale-110',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary scale-110',
                    !isCompleted && !isCurrent && 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
