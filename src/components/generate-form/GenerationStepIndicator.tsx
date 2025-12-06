import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GenerationStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { label: string }[];
  className?: string;
}

export function GenerationStepIndicator({
  currentStep,
  totalSteps,
  steps,
  className,
}: GenerationStepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={index} className="flex items-center gap-2">
            <motion.div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
              initial={false}
              animate={{
                scale: isActive ? 1 : 0.95,
              }}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                isActive && "bg-primary-foreground/20",
                isCompleted && "bg-primary text-primary-foreground",
                !isActive && !isCompleted && "bg-muted-foreground/20"
              )}>
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </motion.div>
            
            {index < totalSteps - 1 && (
              <div className={cn(
                "w-8 h-0.5 rounded-full transition-colors",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
