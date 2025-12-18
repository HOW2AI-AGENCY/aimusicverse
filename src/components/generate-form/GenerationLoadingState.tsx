/**
 * GenerationLoadingState Component
 * 
 * Enhanced loading state with visual feedback during music generation.
 * Features:
 * - Animated progress stages
 * - Estimated time remaining
 * - Cancellation support
 * - Visual progress indicators
 */

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Loader2, Music, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';

interface GenerationStage {
  id: string;
  label: string;
  icon: typeof Music;
  duration: number; // estimated duration in seconds
}

const GENERATION_STAGES: GenerationStage[] = [
  { id: 'queue', label: 'В очереди', icon: Loader2, duration: 5 },
  { id: 'processing', label: 'Обработка', icon: Sparkles, duration: 30 },
  { id: 'generating', label: 'Генерация', icon: Music, duration: 45 },
  { id: 'finalizing', label: 'Финализация', icon: CheckCircle2, duration: 10 },
];

interface GenerationLoadingStateProps {
  /** Current generation stage */
  stage?: 'queue' | 'processing' | 'generating' | 'finalizing' | 'completed' | 'failed';
  /** Optional custom progress percentage (0-100) */
  progress?: number;
  /** Callback when user clicks cancel */
  onCancel?: () => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Custom message */
  message?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function GenerationLoadingState({
  stage = 'queue',
  progress: customProgress,
  onCancel,
  showCancel = true,
  message,
  compact = false,
}: GenerationLoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(90);

  // Calculate estimated time and progress
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const currentStageIndex = GENERATION_STAGES.findIndex(s => s.id === stage);
    if (currentStageIndex === -1) return;

    // Calculate total estimated time based on current stage
    const total = GENERATION_STAGES.slice(0, currentStageIndex + 1).reduce(
      (sum, s) => sum + s.duration,
      0
    );
    setEstimatedTotal(total);

    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        if (prev >= total) return total;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  // Calculate progress percentage
  const progressPercentage = customProgress ?? (elapsedTime / estimatedTotal) * 100;
  const remainingSeconds = Math.max(0, estimatedTotal - elapsedTime);

  const formatRemainingTime = (seconds: number) => {
    if (seconds >= 60) {
      return formatTime(seconds);
    }
    return `${Math.floor(seconds)}с`;
  };

  const currentStage = GENERATION_STAGES.find(s => s.id === stage);
  const StageIcon = currentStage?.icon || Loader2;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <StageIcon className="h-4 w-4 animate-spin text-primary" />
        <span className="text-muted-foreground">
          {currentStage?.label || 'Генерация'}
          {remainingSeconds > 0 && ` • ${formatRemainingTime(remainingSeconds)}`}
        </span>
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Stage indicator with icon */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 p-3 rounded-full">
                <StageIcon 
                  className={cn(
                    "h-6 w-6 text-primary",
                    stage !== 'completed' && stage !== 'failed' && "animate-spin"
                  )} 
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {currentStage?.label || 'Генерация музыки'}
              </h3>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}%</span>
              {remainingSeconds > 0 && (
                <span>Осталось: ~{formatRemainingTime(remainingSeconds)}</span>
              )}
            </div>
          </div>

          {/* Stage timeline */}
          <div className="flex justify-between gap-1">
            {GENERATION_STAGES.map((s, index) => {
              const activeIndex = GENERATION_STAGES.findIndex(stg => stg.id === stage);
              const isCompleted = index < activeIndex;
              const isActive = index === activeIndex;
              
              return (
                <motion.div
                  key={s.id}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    isCompleted && "bg-primary",
                    isActive && "bg-primary/50",
                    !isCompleted && !isActive && "bg-muted"
                  )}
                  initial={false}
                  animate={{
                    opacity: isCompleted ? 1 : isActive ? 0.8 : 0.3,
                  }}
                />
              );
            })}
          </div>

          {/* Cancel button */}
          {showCancel && onCancel && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Отменить
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

/**
 * Compact inline loading indicator for use in buttons or small spaces
 */
export function GenerationLoadingInline({
  stage = 'processing',
  className,
}: {
  stage?: string;
  className?: string;
}) {
  const stageData = GENERATION_STAGES.find(s => s.id === stage);
  const Icon = stageData?.icon || Loader2;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Icon className="h-3.5 w-3.5 animate-spin" />
      <span>{stageData?.label || 'Обработка'}</span>
    </span>
  );
}
