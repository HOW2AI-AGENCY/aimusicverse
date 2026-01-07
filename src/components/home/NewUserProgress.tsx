/**
 * NewUserProgress - Progress indicator for new users
 * Shows onboarding completion steps
 */

import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useUserJourneyStore } from '@/hooks/useUserJourneyState';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

export const NewUserProgress = memo(function NewUserProgress() {
  const {
    hasGeneratedTrack,
    hasPlayedTrack,
    hasVisitedLibrary,
    completedOnboarding,
  } = useUserJourneyStore();

  const steps: ProgressStep[] = useMemo(() => {
    const baseSteps = [
      { id: 'onboarding', label: 'Знакомство', completed: completedOnboarding || hasGeneratedTrack },
      { id: 'create', label: 'Первый трек', completed: hasGeneratedTrack },
      { id: 'play', label: 'Послушать', completed: hasPlayedTrack },
      { id: 'library', label: 'Библиотека', completed: hasVisitedLibrary },
    ];

    // Find first incomplete step index
    const firstIncompleteIndex = baseSteps.findIndex(s => !s.completed);

    // Map with current flag
    return baseSteps.map((step, index) => ({
      ...step,
      current: index === firstIncompleteIndex,
    }));
  }, [completedOnboarding, hasGeneratedTrack, hasPlayedTrack, hasVisitedLibrary]);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  // Don't show if all steps completed
  if (completedCount === steps.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted/30 border border-border/50 p-3 sm:p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-foreground">
          Твой прогресс
        </h3>
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {completedCount} из {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden mb-2 sm:mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-generate rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Steps - horizontal scroll on mobile */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 shrink-0",
              step.completed && "text-primary",
              step.current && "text-primary",
              !step.completed && !step.current && "text-muted-foreground"
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : step.current ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.div>
            ) : (
              <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});
