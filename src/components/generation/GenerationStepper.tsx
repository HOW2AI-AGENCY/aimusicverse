import { motion } from '@/lib/motion';
import { Check, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon?: React.ElementType;
  completed?: boolean;
}

interface GenerationStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  variant?: 'horizontal' | 'vertical' | 'compact';
}

export function GenerationStepper({ 
  steps, 
  currentStep, 
  onStepClick,
  variant = 'horizontal' 
}: GenerationStepperProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <motion.div
              key={step.id}
              className="flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => onStepClick?.(index)}
                disabled={index > currentStep}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-primary w-6",
                  !isCompleted && !isCurrent && "bg-muted-foreground/30",
                  index <= currentStep && onStepClick && "cursor-pointer"
                )}
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className="flex flex-col gap-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <motion.button
                  onClick={() => onStepClick?.(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground",
                    index <= currentStep && onStepClick && "cursor-pointer hover:scale-110"
                  )}
                  whileHover={index <= currentStep ? { scale: 1.05 } : {}}
                  whileTap={index <= currentStep ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </motion.button>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-8 mt-1",
                    index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
              
              <div className="flex-1 pt-1">
                <p className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-primary"
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <motion.button
              onClick={() => onStepClick?.(index)}
              disabled={index > currentStep}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[60px]",
                index <= currentStep && onStepClick && "cursor-pointer"
              )}
              whileHover={index <= currentStep ? { scale: 1.05 } : {}}
              whileTap={index <= currentStep ? { scale: 0.95 } : {}}
            >
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                )}
                initial={false}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : Icon ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>
              
              <span className={cn(
                "text-xs font-medium text-center whitespace-nowrap",
                isCurrent ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </motion.button>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-muted-foreground/30" />
                <motion.div
                  className="absolute inset-0 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentStep ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
