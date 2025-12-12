/**
 * Workflow Engine for Sprint 026 US-026-003
 * 
 * State machine for guiding users through complex multi-step workflows
 * Tracks progress, provides hints, and ensures proper completion
 */

import { logger } from '@/lib/logger';

// Workflow types
export type WorkflowId = 
  | 'first-track'           // First-time track creation
  | 'guitar-to-full'        // Guitar recording to full track
  | 'stem-separation'       // Guide for stem separation
  | 'track-remix';          // Remixing existing tracks

// Workflow step definition
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  hint?: string;
  action?: string;
  navigationHint?: string;
  completionCheck?: () => boolean | Promise<boolean>;
  optional?: boolean;
}

// Workflow definition
export interface Workflow {
  id: WorkflowId;
  title: string;
  description: string;
  estimatedTime: string;
  steps: WorkflowStep[];
  onComplete?: () => void;
}

// Workflow state
export interface WorkflowState {
  workflowId: WorkflowId;
  currentStepIndex: number;
  completedSteps: Set<string>;
  startedAt: Date;
  completedAt?: Date;
  skipped: boolean;
}

// All available workflows
export const WORKFLOWS: Record<WorkflowId, Workflow> = {
  'first-track': {
    id: 'first-track',
    title: 'Создание первого трека',
    description: 'Пошаговое руководство по созданию вашего первого трека',
    estimatedTime: '5-10 минут',
    steps: [
      {
        id: 'welcome',
        title: 'Добро пожаловать!',
        description: 'Создадим ваш первый музыкальный трек',
        hint: 'Этот процесс займет всего несколько минут',
      },
      {
        id: 'select-method',
        title: 'Выберите способ создания',
        description: 'Используйте Quick Create для быстрого старта или Guitar Studio для записи',
        action: 'Перейти в Music Lab',
        navigationHint: '/music-lab',
      },
      {
        id: 'configure-track',
        title: 'Настройте параметры',
        description: 'Выберите стиль, настроение и другие параметры трека',
        hint: 'Можете использовать готовые пресеты или задать свои параметры',
      },
      {
        id: 'generate',
        title: 'Запустите генерацию',
        description: 'Подтвердите параметры и начните создание трека',
        hint: 'Генерация обычно занимает 1-2 минуты',
      },
      {
        id: 'view-result',
        title: 'Просмотрите результат',
        description: 'Трек готов! Послушайте результат в библиотеке',
        action: 'Открыть библиотеку',
        navigationHint: '/library',
      },
    ],
  },

  'guitar-to-full': {
    id: 'guitar-to-full',
    title: 'От гитары до полного трека',
    description: 'Превратите гитарную запись в полноценную композицию',
    estimatedTime: '10-15 минут',
    steps: [
      {
        id: 'record-guitar',
        title: 'Запишите гитару',
        description: 'Откройте Guitar Studio и запишите свою партию',
        action: 'Открыть Guitar Studio',
        navigationHint: '/music-lab?tab=guitar',
        hint: 'Убедитесь, что микрофон подключен и настроен',
      },
      {
        id: 'analyze',
        title: 'Анализ записи',
        description: 'Система проанализирует аккорды, BPM и тональность',
        hint: 'Анализ занимает 10-30 секунд',
      },
      {
        id: 'review-analysis',
        title: 'Проверьте результаты',
        description: 'Посмотрите определенные аккорды и параметры',
        hint: 'При необходимости можно внести корректировки',
      },
      {
        id: 'generate-full',
        title: 'Создайте полный трек',
        description: 'Используйте "Create Track from This" для генерации',
        hint: 'Ваша гитара будет основой для полной аранжировки',
      },
      {
        id: 'listen-result',
        title: 'Оцените результат',
        description: 'Послушайте полную версию с вашей гитарой',
        action: 'Перейти к треку',
      },
      {
        id: 'open-stems',
        title: 'Разделите на стемы (опционально)',
        description: 'Откройте Stem Studio для детальной работы',
        action: 'Открыть Stem Studio',
        optional: true,
      },
    ],
  },

  'stem-separation': {
    id: 'stem-separation',
    title: 'Разделение на стемы',
    description: 'Научитесь работать с отдельными дорожками трека',
    estimatedTime: '5-7 минут',
    steps: [
      {
        id: 'select-track',
        title: 'Выберите трек',
        description: 'Откройте любой трек из библиотеки',
        hint: 'Лучше начать с простого трека',
      },
      {
        id: 'open-stem-studio',
        title: 'Откройте Stem Studio',
        description: 'Нажмите "Stem Studio" в меню трека',
        action: 'Открыть Stem Studio',
      },
      {
        id: 'start-separation',
        title: 'Запустите разделение',
        description: 'Нажмите кнопку "Разделить на стемы"',
        hint: 'Процесс занимает 30-60 секунд',
      },
      {
        id: 'review-stems',
        title: 'Изучите стемы',
        description: 'Прослушайте каждую дорожку отдельно',
        hint: 'Vocals, Instrumental, Drums, Bass',
      },
      {
        id: 'adjust-mix',
        title: 'Настройте микс',
        description: 'Измените громкость отдельных дорожек',
        hint: 'Используйте слайдеры громкости для каждого стема',
      },
      {
        id: 'export',
        title: 'Экспортируйте результат',
        description: 'Сохраните отдельные стемы или новый микс',
        optional: true,
      },
    ],
  },

  'track-remix': {
    id: 'track-remix',
    title: 'Ремикс трека',
    description: 'Создайте новую версию существующего трека',
    estimatedTime: '8-12 минут',
    steps: [
      {
        id: 'find-track',
        title: 'Найдите трек',
        description: 'Выберите трек для ремикса из библиотеки или публичного каталога',
        hint: 'Можно использовать свои треки или общедоступные',
      },
      {
        id: 'open-remix',
        title: 'Откройте меню ремикса',
        description: 'Нажмите "Remix" в меню действий трека',
        action: 'Открыть ремикс',
      },
      {
        id: 'choose-style',
        title: 'Выберите новый стиль',
        description: 'Задайте стиль для ремикса (жанр, настроение, темп)',
        hint: 'Можете кардинально изменить звучание',
      },
      {
        id: 'adjust-params',
        title: 'Настройте параметры',
        description: 'Укажите, сохранить ли мелодию, структуру или лирику',
        hint: 'Audio Weight контролирует влияние оригинала',
      },
      {
        id: 'generate-remix',
        title: 'Создайте ремикс',
        description: 'Запустите генерацию новой версии',
        hint: 'Ремикс будет создан с учетом оригинала',
      },
      {
        id: 'compare',
        title: 'Сравните версии',
        description: 'Послушайте оригинал и ремикс рядом',
        action: 'Открыть версии',
      },
    ],
  },
};

/**
 * Workflow Engine class
 */
export class WorkflowEngine {
  private static readonly STORAGE_KEY = 'workflow-state';
  
  /**
   * Start a new workflow
   */
  static startWorkflow(workflowId: WorkflowId): WorkflowState {
    const state: WorkflowState = {
      workflowId,
      currentStepIndex: 0,
      completedSteps: new Set(),
      startedAt: new Date(),
      skipped: false,
    };
    
    this.saveState(state);
    logger.info('Workflow started', { workflowId });
    return state;
  }
  
  /**
   * Get current workflow state
   */
  static getState(): WorkflowState | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Restore Set from array
      parsed.completedSteps = new Set(parsed.completedSteps);
      parsed.startedAt = new Date(parsed.startedAt);
      if (parsed.completedAt) {
        parsed.completedAt = new Date(parsed.completedAt);
      }
      
      return parsed;
    } catch (error) {
      logger.error('Failed to get workflow state', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  /**
   * Save workflow state
   */
  static saveState(state: WorkflowState): void {
    try {
      // Convert Set to array for storage
      const toStore = {
        ...state,
        completedSteps: Array.from(state.completedSteps),
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      logger.error('Failed to save workflow state', error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Complete current step and move to next
   */
  static completeStep(stepId: string): WorkflowState | null {
    const state = this.getState();
    if (!state) return null;
    
    state.completedSteps.add(stepId);
    state.currentStepIndex++;
    
    const workflow = WORKFLOWS[state.workflowId];
    
    // Check if workflow is complete
    if (state.currentStepIndex >= workflow.steps.length) {
      state.completedAt = new Date();
      logger.info('Workflow completed', {
        workflowId: state.workflowId,
        duration: state.completedAt.getTime() - state.startedAt.getTime(),
      });
      
      workflow.onComplete?.();
    }
    
    this.saveState(state);
    return state;
  }
  
  /**
   * Skip to a specific step
   */
  static goToStep(stepIndex: number): WorkflowState | null {
    const state = this.getState();
    if (!state) return null;
    
    const workflow = WORKFLOWS[state.workflowId];
    if (stepIndex < 0 || stepIndex >= workflow.steps.length) {
      logger.warn('Invalid step index', { stepIndex });
      return null;
    }
    
    state.currentStepIndex = stepIndex;
    this.saveState(state);
    return state;
  }
  
  /**
   * Skip/dismiss the current workflow
   */
  static skipWorkflow(): void {
    const state = this.getState();
    if (state) {
      state.skipped = true;
      state.completedAt = new Date();
      this.saveState(state);
      logger.info('Workflow skipped', { workflowId: state.workflowId });
    }
  }
  
  /**
   * Clear workflow state
   */
  static clearState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    logger.info('Workflow state cleared');
  }
  
  /**
   * Get current workflow definition
   */
  static getCurrentWorkflow(): Workflow | null {
    const state = this.getState();
    if (!state) return null;
    return WORKFLOWS[state.workflowId];
  }
  
  /**
   * Get current step
   */
  static getCurrentStep(): WorkflowStep | null {
    const state = this.getState();
    const workflow = this.getCurrentWorkflow();
    if (!state || !workflow) return null;
    
    return workflow.steps[state.currentStepIndex] || null;
  }
  
  /**
   * Check if a workflow is active
   */
  static isActive(): boolean {
    const state = this.getState();
    return state !== null && !state.skipped && !state.completedAt;
  }
  
  /**
   * Get progress percentage
   */
  static getProgress(): number {
    const state = this.getState();
    const workflow = this.getCurrentWorkflow();
    if (!state || !workflow) return 0;
    
    return Math.round((state.currentStepIndex / workflow.steps.length) * 100);
  }
}
