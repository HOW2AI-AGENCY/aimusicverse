/**
 * ProgressTracker Component - Sprint 026 US-026-003
 * 
 * Visual progress tracker for workflows
 */

import { CheckCircle, Circle, Clock } from 'lucide-react';
import { motion } from '@/lib/motion';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  compact?: boolean;
}

export function ProgressTracker({ 
  steps, 
  orientation = 'horizontal',
  compact = false 
}: ProgressTrackerProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (orientation === 'vertical') {
    return (
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${step.current ? 'bg-primary text-primary-foreground' : ''}
                  ${step.completed ? 'bg-primary/20 text-primary' : ''}
                  ${!step.current && !step.completed ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : step.current ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-8 ${step.completed ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-medium ${step.current ? 'text-primary' : step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Прогресс</span>
          <span className="text-muted-foreground">
            {completedCount} из {steps.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center shrink-0">
            {index > 0 && (
              <div className={`w-12 h-0.5 ${step.completed ? 'bg-primary' : 'bg-muted'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium
                  ${step.current ? 'bg-primary text-primary-foreground ring-2 ring-primary/20' : ''}
                  ${step.completed ? 'bg-primary/20 text-primary' : ''}
                  ${!step.current && !step.completed ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.current ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs text-center max-w-[80px] ${step.current ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
