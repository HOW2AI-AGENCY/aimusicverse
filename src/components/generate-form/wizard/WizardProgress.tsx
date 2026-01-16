/**
 * WizardProgress - Visual progress indicator for generation wizard
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Check, Lightbulb, Music, Mic, FileText, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/stores/generationWizardStore';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
}

const STEPS_CONFIG: { step: WizardStep; label: string; icon: typeof Lightbulb }[] = [
  { step: 'idea', label: 'Идея', icon: Lightbulb },
  { step: 'style', label: 'Стиль', icon: Music },
  { step: 'vocals', label: 'Вокал', icon: Mic },
  { step: 'lyrics', label: 'Текст', icon: FileText },
  { step: 'settings', label: 'Настройки', icon: Settings },
  { step: 'preview', label: 'Генерация', icon: Sparkles },
];

export const WizardProgress = memo(function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  const currentIndex = STEPS_CONFIG.findIndex(s => s.step === currentStep);

  return (
    <div className="flex items-center justify-between gap-1 px-2 py-3">
      {STEPS_CONFIG.map((config, index) => {
        const isCompleted = completedSteps.includes(config.step);
        const isCurrent = config.step === currentStep;
        const isClickable = isCompleted || index <= currentIndex;
        const Icon = config.icon;

        return (
          <div key={config.step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(config.step)}
              disabled={!isClickable}
              className={cn(
                "relative flex flex-col items-center gap-1 transition-all",
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted 
                    ? 'hsl(var(--primary))' 
                    : isCurrent 
                      ? 'hsl(var(--primary) / 0.2)' 
                      : 'hsl(var(--muted))',
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Icon className={cn(
                    "w-4 h-4",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                isCurrent ? "text-primary" : "text-muted-foreground"
              )}>
                {config.label}
              </span>
            </button>

            {/* Connector line */}
            {index < STEPS_CONFIG.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-primary"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
