import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepDef {
  label: string;
  /** Marks the step as completed (data provided by user). */
  done?: boolean;
}

interface GenerationStepIndicatorProps {
  /** Index of the step currently in focus. */
  currentStep: number;
  steps: StepDef[];
  className?: string;
}

/**
 * Linear/Arc-inspired stepper. Aurora-tinted, animated, mobile-first.
 */
export function GenerationStepIndicator({
  currentStep,
  steps,
  className,
}: GenerationStepIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5',
        className,
      )}
      role="list"
      aria-label="Прогресс создания трека"
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = !!step.done && !isActive;
        const isUpcoming = !isActive && !isCompleted;

        return (
          <div key={index} className="flex items-center gap-1.5 flex-shrink-0" role="listitem">
            <motion.div
              layout
              initial={false}
              animate={{ scale: isActive ? 1 : 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={cn(
                'flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full border text-[11px] font-medium leading-none tracking-tight transition-colors',
                isActive &&
                  'bg-primary/15 border-primary/45 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)_inset]',
                isCompleted && 'bg-primary/8 border-primary/30 text-primary',
                isUpcoming && 'bg-muted/40 border-border/60 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-primary/25 text-primary',
                  isUpcoming && 'bg-muted-foreground/15 text-muted-foreground',
                )}
                aria-hidden
              >
                {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
            </motion.div>

            {index < steps.length - 1 && (
              <span
                className={cn(
                  'h-px w-4 rounded-full transition-colors',
                  isCompleted || isActive ? 'bg-primary/40' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
