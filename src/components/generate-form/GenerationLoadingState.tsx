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

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Loader2, Music, Sparkles, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/formatters";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GenerationStage {
  id: string;
  label: string;
  icon: typeof Music;
  duration: number; // estimated duration in seconds
}

const GENERATION_STAGES: GenerationStage[] = [
  { id: "queue", label: "В очереди", icon: Loader2, duration: 5 },
  { id: "processing", label: "Обдумывание", icon: Sparkles, duration: 30 },
  { id: "generating", label: "Композиция", icon: Music, duration: 45 },
  { id: "finalizing", label: "Финальный микс", icon: CheckCircle2, duration: 10 },
];


interface GenerationLoadingStateProps {
  /** Current generation stage */
  stage?: "queue" | "processing" | "generating" | "finalizing" | "completed" | "failed";
  /** Optional custom progress percentage (0-100) */
  progress?: number;
  /** Callback when user clicks cancel */
  onCancel?: () => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Custom message (shown as secondary text) */
  message?: string;
  /** Error description shown when stage="failed" */
  errorMessage?: string;
  /** Callback when user clicks retry after failure */
  onRetry?: () => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function GenerationLoadingState({
  stage = "queue",
  progress: customProgress,
  onCancel,
  showCancel = true,
  message,
  errorMessage = "Произошла ошибка при генерации",
  onRetry,
  compact = false,
}: GenerationLoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(90);
  const reducedMotion = useReducedMotion();

  // Full-run estimate across all stages so the bar advances В очереди → Финализация.

  useEffect(() => {
    const total = GENERATION_STAGES.reduce((sum, s) => sum + s.duration, 0);
    setEstimatedTotal(total);

    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
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

  // Advance the visible stage with progress. Callers (GenerateSheet) hold `stage`
  // fixed at "processing" for the whole run, so derive the display stage from the
  // elapsed-time estimate rather than the static prop.
  // ponytail: thresholds track GENERATION_STAGES durations; replace with real
  // clip-based progress (useGenerationTaskProgress) when GenerateSheet wires currentTaskId through.
  const displayStageIndex =
    stage === "completed"
      ? GENERATION_STAGES.length - 1
      : progressPercentage < 8
        ? 0
        : progressPercentage < 45
          ? 1
          : progressPercentage < 90
            ? 2
            : 3;
  const currentStage = GENERATION_STAGES[displayStageIndex];
  const StageIcon = currentStage?.icon || Loader2;

  if (stage === "failed") {
    if (compact) {
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-sm text-destructive", compact ? "" : "")}>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{errorMessage}</span>
        </span>
      );
    }
    return (
      <Card className="p-6 space-y-4 border-destructive/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Ошибка генерации</h3>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <div className="flex gap-3 mt-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Попробовать снова
              </Button>
            )}
            {showCancel && onCancel && (
              <Button onClick={onCancel} variant="ghost" className="gap-2 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                Закрыть
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <StageIcon className="h-4 w-4 animate-spin text-generate" />
        <span className="text-muted-foreground">
          {currentStage?.label || "Генерация"}
          {remainingSeconds > 0 && ` • ${formatRemainingTime(remainingSeconds)}`}
        </span>
      </div>
    );
  }

  return (
    <Card className="p-5 sm:p-6 space-y-4 max-w-full border-border/40 bg-sheet-card/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={reducedMotion ? undefined : { duration: 0.25 }}
          className="space-y-4"
        >
          {/* Stage indicator — calm, no ping halo */}
          <div className="flex items-center gap-3">
            <div className="relative bg-neon/10 border border-neon/30 p-2.5 rounded-full">
              <StageIcon
                className={cn("h-5 w-5 text-neon", stage !== "completed" && !reducedMotion && "animate-spin")}
                aria-hidden
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-foreground leading-tight">
                {currentStage?.label || "Генерация музыки"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {message ?? "Модель Suno подбирает звуки и структуру"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress value={progressPercentage} className="h-1.5" />
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>{Math.round(progressPercentage)}%</span>
              {remainingSeconds > 0 && <span>~{formatRemainingTime(remainingSeconds)}</span>}
            </div>
          </div>


          {/* Stage timeline */}
          <div className="flex justify-between gap-1">
            {GENERATION_STAGES.map((s, index) => {
              const activeIndex = displayStageIndex;
              const isCompleted = index < activeIndex;
              const isActive = index === activeIndex;

              return (
                <motion.div
                  key={s.id}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    isCompleted && "bg-generate",
                    isActive && "bg-generate/50",
                    !isCompleted && !isActive && "bg-muted",
                  )}
                  initial={reducedMotion ? undefined : false}
                  animate={
                    reducedMotion
                      ? undefined
                      : {
                          opacity: isCompleted ? 1 : isActive ? 0.8 : 0.3,
                        }
                  }
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
                className="text-muted-foreground hover:text-destructive focus-visible:text-destructive"
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
export function GenerationLoadingInline({ stage = "processing", className }: { stage?: string; className?: string }) {
  const stageData = GENERATION_STAGES.find((s) => s.id === stage);
  const Icon = stageData?.icon || Loader2;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Icon className="h-3.5 w-3.5 animate-spin" />
      <span>{stageData?.label || "Обработка"}</span>
    </span>
  );
}
