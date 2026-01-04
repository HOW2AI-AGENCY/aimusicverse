/**
 * WorkflowGuide Component - Sprint 026 US-026-003
 * 
 * Displays current workflow progress and step-by-step guidance
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowEngine, WorkflowState, Workflow, WorkflowStep } from '@/lib/workflow-engine';
import { CheckCircle, Circle, X, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface WorkflowGuideProps {
  compact?: boolean;
  onDismiss?: () => void;
}

export function WorkflowGuide({ compact = false, onDismiss }: WorkflowGuideProps) {
  const [state, setState] = useState<WorkflowState | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial state
    const loadState = () => {
      const workflowState = WorkflowEngine.getState();
      const workflowDef = WorkflowEngine.getCurrentWorkflow();
      const step = WorkflowEngine.getCurrentStep();
      
      setState(workflowState);
      setWorkflow(workflowDef);
      setCurrentStep(step);
    };

    loadState();

    // Poll for state changes (in case other components update it)
    const interval = setInterval(loadState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (!currentStep) return;
    
    const newState = WorkflowEngine.completeStep(currentStep.id);
    setState(newState);
    setCurrentStep(WorkflowEngine.getCurrentStep());
    
    logger.info('Workflow step completed', { stepId: currentStep.id });
  };

  const handleSkip = () => {
    WorkflowEngine.skipWorkflow();
    onDismiss?.();
    logger.info('Workflow dismissed');
  };

  const handleAction = () => {
    if (currentStep?.navigationHint) {
      navigate(currentStep.navigationHint);
    }
  };

  if (!state || !workflow || !currentStep || !WorkflowEngine.isActive()) {
    return null;
  };

  const progress = WorkflowEngine.getProgress();

  // Compact mode - small floating indicator
  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-4 z-40 max-w-sm"
        >
          <Card className="p-3 glass-mobile border-primary/50">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {workflow.title}
                </p>
                <p className="text-sm font-medium truncate">
                  {currentStep.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">
                  {progress}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full mode - detailed guide
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full"
      >
        <Card className="p-4 sm:p-6 glass-mobile border-primary/30">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold">{workflow.title}</h3>
              <p className="text-sm text-muted-foreground">
                {workflow.description}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Прогресс</span>
              <span className="text-xs text-muted-foreground">
                Шаг {state.currentStepIndex + 1} из {workflow.steps.length}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto">
            {workflow.steps.map((step, index) => {
              const isCompleted = state.completedSteps.has(step.id);
              const isCurrent = index === state.currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center shrink-0">
                  {index > 0 && (
                    <div className={`w-4 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                      ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                      ${!isCurrent && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current step details */}
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="font-semibold mb-1">{currentStep.title}</h4>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>

            {currentStep.hint && (
              <div className="flex gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {currentStep.hint}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {currentStep.action && currentStep.navigationHint && (
              <Button
                onClick={handleAction}
                variant="outline"
                className="flex-1"
              >
                {currentStep.action}
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {state.currentStepIndex === workflow.steps.length - 1 
                ? 'Завершить' 
                : 'Далее'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
