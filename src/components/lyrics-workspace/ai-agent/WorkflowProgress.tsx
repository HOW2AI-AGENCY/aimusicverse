/**
 * WorkflowProgress - Visual progress indicator for multi-step workflows
 */

import { motion } from '@/lib/motion';
import { Check, Pause, Play, SkipForward, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WorkflowStep, Workflow } from './hooks/useWorkflowEngine';

interface WorkflowProgressProps {
  workflow: Workflow;
  currentStepIndex: number;
  stepResults: Record<number, any>;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function WorkflowProgress({
  workflow,
  currentStepIndex,
  stepResults,
  status,
  progress,
  onPause,
  onResume,
  onSkip,
  onCancel,
}: WorkflowProgressProps) {
  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-3 mb-3 p-3 rounded-xl bg-muted/50 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          {status === 'paused' && <Pause className="w-4 h-4 text-amber-400" />}
          {status === 'completed' && <Check className="w-4 h-4 text-emerald-400" />}
          <span className="text-sm font-medium">{workflow.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'running' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
              <Pause className="w-3.5 h-3.5" />
            </Button>
          )}
          {status === 'paused' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResume}>
              <Play className="w-3.5 h-3.5" />
            </Button>
          )}
          {(status === 'running' || status === 'paused') && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {workflow.steps.map((step, index) => {
          const result = stepResults[index];
          const isComplete = result && !result.skipped;
          const isSkipped = result?.skipped;
          const isCurrent = index === currentStepIndex && status === 'running';
          const isPending = index > currentStepIndex;

          return (
            <div key={index} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap transition-all",
                  isComplete && "bg-emerald-500/20 text-emerald-400",
                  isSkipped && "bg-muted text-muted-foreground line-through",
                  isCurrent && "bg-primary/20 text-primary ring-1 ring-primary/50",
                  isPending && "bg-muted/50 text-muted-foreground"
                )}
              >
                {isComplete && <Check className="w-3 h-3" />}
                {isCurrent && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{step.label}</span>
              </div>
              {index < workflow.steps.length - 1 && (
                <div className={cn(
                  "w-4 h-0.5 mx-0.5",
                  index < currentStepIndex ? "bg-emerald-500/50" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <Progress value={progress * 100} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Current step info */}
      {status === 'running' && workflow.steps[currentStepIndex] && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {workflow.steps[currentStepIndex].label}...
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs gap-1"
            onClick={onSkip}
          >
            <SkipForward className="w-3 h-3" />
            Пропустить
          </Button>
        </div>
      )}

      {/* Completion message */}
      {status === 'completed' && (
        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Workflow завершён
        </div>
      )}
    </motion.div>
  );
}
