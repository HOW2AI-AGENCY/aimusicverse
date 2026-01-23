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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-muted/30 border border-border/50 p-2.5 sm:p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] sm:text-sm font-medium text-foreground">
          Твой прогресс
        </h3>
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-primary to-generate rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps - horizontal scroll on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-1 shrink-0",
              step.completed && "text-primary",
              step.current && "text-primary",
              !step.completed && !step.current && "text-muted-foreground"
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            ) : (
              <Circle className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", step.current && "animate-pulse")} />
            )}
            <span className="text-[9px] sm:text-xs font-medium whitespace-nowrap">
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});
