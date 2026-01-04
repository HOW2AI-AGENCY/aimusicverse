/**
 * useWorkflowEngine - Multi-step workflow automation for AI tools
 */

import { useState, useCallback, useRef } from 'react';
import { AIToolId, AIAgentContext } from '../types';

export interface WorkflowStep {
  toolId: AIToolId;
  label: string;
  autoApply?: boolean;
  condition?: (prevResult: any, context: AIAgentContext) => boolean;
  transform?: (prevResult: any) => Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowState {
  workflow: Workflow | null;
  currentStepIndex: number;
  stepResults: Record<number, any>;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
}

interface UseWorkflowEngineOptions {
  context: AIAgentContext;
  executeTool: (toolId: AIToolId, input: Record<string, any>) => Promise<any>;
  onStepComplete?: (step: WorkflowStep, result: any) => void;
  onWorkflowComplete?: (results: Record<number, any>) => void;
  onError?: (error: string) => void;
}

export const WORKFLOWS: Workflow[] = [
  {
    id: 'quick_start',
    name: 'Быстрый старт',
    description: 'Генерация + автоматические теги',
    steps: [
      { toolId: 'write', label: 'Генерация текста', autoApply: true },
      { toolId: 'tags', label: 'Добавление тегов', autoApply: true },
    ],
  },
  {
    id: 'improve',
    name: 'Анализ и улучшение',
    description: 'Полный анализ + оптимизация',
    steps: [
      { toolId: 'analyze', label: 'Анализ текста' },
      { 
        toolId: 'optimize', 
        label: 'Оптимизация',
        condition: (prev) => prev?.qualityScore !== undefined ? prev.qualityScore < 85 : true,
        autoApply: true 
      },
      { toolId: 'tags', label: 'Финальные теги', autoApply: true },
    ],
  },
  {
    id: 'professional',
    name: 'Профессиональный',
    description: 'Полный цикл продакшена',
    steps: [
      { toolId: 'write', label: 'Генерация', autoApply: true },
      { toolId: 'analyze', label: 'Анализ' },
      { toolId: 'producer', label: 'Продюсерский разбор' },
      { 
        toolId: 'optimize', 
        label: 'Оптимизация',
        condition: (prev) => prev?.producerReview?.overallScore < 80,
        autoApply: true 
      },
      { toolId: 'validate_v5', label: 'V5 проверка' },
      { toolId: 'tags', label: 'Финальные теги', autoApply: true },
    ],
  },
  {
    id: 'drill_track',
    name: 'Drill трек',
    description: 'UK Drill с полной подготовкой',
    steps: [
      { toolId: 'drill_builder', label: 'Drill генерация', autoApply: true },
      { toolId: 'validate_v5', label: 'V5 проверка' },
      { toolId: 'vocal_map', label: 'Вокальная карта' },
      { toolId: 'tags', label: 'Drill теги', autoApply: true },
    ],
  },
  {
    id: 'translate_adapt',
    name: 'Перевод + Адаптация',
    description: 'Перевод с сохранением ритма',
    steps: [
      { toolId: 'translate', label: 'Перевод' },
      { 
        toolId: 'paraphrase', 
        label: 'Адаптация',
        transform: (prev) => ({ lyrics: prev?.translation?.translatedLyrics || prev?.lyrics })
      },
      { toolId: 'tags', label: 'Теги', autoApply: true },
    ],
  },
  {
    id: 'full_check',
    name: 'Полная проверка',
    description: 'V5 валидация + рекомендации',
    steps: [
      { toolId: 'validate_v5', label: 'V5 синтаксис' },
      { toolId: 'rhythm', label: 'Анализ ритма' },
    ],
  },
];

export function useWorkflowEngine({
  context,
  executeTool,
  onStepComplete,
  onWorkflowComplete,
  onError,
}: UseWorkflowEngineOptions) {
  const [state, setState] = useState<WorkflowState>({
    workflow: null,
    currentStepIndex: 0,
    stepResults: {},
    status: 'idle',
  });

  const abortRef = useRef(false);

  const startWorkflow = useCallback(async (workflowId: string, initialInput?: Record<string, any>) => {
    const workflow = WORKFLOWS.find(w => w.id === workflowId);
    if (!workflow) {
      onError?.(`Workflow not found: ${workflowId}`);
      return;
    }

    abortRef.current = false;
    setState({
      workflow,
      currentStepIndex: 0,
      stepResults: {},
      status: 'running',
    });

    let stepResults: Record<number, any> = {};
    let lastResult: any = initialInput || {};

    for (let i = 0; i < workflow.steps.length; i++) {
      if (abortRef.current) {
        setState(prev => ({ ...prev, status: 'paused' }));
        return;
      }

      const step = workflow.steps[i];

      // Check condition
      if (step.condition && !step.condition(lastResult, context)) {
        // Skip this step
        stepResults[i] = { skipped: true };
        continue;
      }

      setState(prev => ({ ...prev, currentStepIndex: i }));

      try {
        // Transform input if needed
        const input = step.transform ? step.transform(lastResult) : {};
        
        const result = await executeTool(step.toolId, input);
        
        if (result) {
          stepResults[i] = result;
          lastResult = result;
          onStepComplete?.(step, result);
        }

        setState(prev => ({ ...prev, stepResults }));

        // Small delay between steps for UX
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, status: 'error', error: errorMessage }));
        onError?.(errorMessage);
        return;
      }
    }

    setState(prev => ({ ...prev, status: 'completed' }));
    onWorkflowComplete?.(stepResults);
  }, [context, executeTool, onStepComplete, onWorkflowComplete, onError]);

  const pauseWorkflow = useCallback(() => {
    abortRef.current = true;
  }, []);

  const resumeWorkflow = useCallback(async () => {
    if (!state.workflow || state.status !== 'paused') return;

    abortRef.current = false;
    setState(prev => ({ ...prev, status: 'running' }));

    // Continue from current step
    const { workflow, currentStepIndex, stepResults } = state;
    let lastResult = stepResults[currentStepIndex - 1] || {};

    for (let i = currentStepIndex; i < workflow.steps.length; i++) {
      if (abortRef.current) {
        setState(prev => ({ ...prev, status: 'paused' }));
        return;
      }

      const step = workflow.steps[i];

      if (step.condition && !step.condition(lastResult, context)) {
        continue;
      }

      setState(prev => ({ ...prev, currentStepIndex: i }));

      try {
        const input = step.transform ? step.transform(lastResult) : {};
        const result = await executeTool(step.toolId, input);
        
        if (result) {
          stepResults[i] = result;
          lastResult = result;
          onStepComplete?.(step, result);
        }

        setState(prev => ({ ...prev, stepResults: { ...prev.stepResults, [i]: result } }));
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, status: 'error', error: errorMessage }));
        return;
      }
    }

    setState(prev => ({ ...prev, status: 'completed' }));
    onWorkflowComplete?.(stepResults);
  }, [state, context, executeTool, onStepComplete, onWorkflowComplete]);

  const skipStep = useCallback(() => {
    if (!state.workflow || state.status !== 'running') return;
    
    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= state.workflow.steps.length) {
      setState(prev => ({ ...prev, status: 'completed' }));
      onWorkflowComplete?.(state.stepResults);
    } else {
      setState(prev => ({ 
        ...prev, 
        currentStepIndex: nextIndex,
        stepResults: { ...prev.stepResults, [prev.currentStepIndex]: { skipped: true } }
      }));
    }
  }, [state, onWorkflowComplete]);

  const cancelWorkflow = useCallback(() => {
    abortRef.current = true;
    setState({
      workflow: null,
      currentStepIndex: 0,
      stepResults: {},
      status: 'idle',
    });
  }, []);

  const progress = state.workflow 
    ? (state.currentStepIndex + (state.status === 'completed' ? 1 : 0)) / state.workflow.steps.length 
    : 0;

  return {
    workflow: state.workflow,
    currentStep: state.workflow?.steps[state.currentStepIndex] || null,
    currentStepIndex: state.currentStepIndex,
    stepResults: state.stepResults,
    status: state.status,
    error: state.error,
    progress,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    skipStep,
    cancelWorkflow,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
    isCompleted: state.status === 'completed',
  };
}
