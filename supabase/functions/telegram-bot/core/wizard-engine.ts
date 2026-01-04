/**
 * Wizard Engine for Step-by-Step Workflows
 * Handles multi-step processes like generation, upload, etc.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { menuManager, type Menu, type MenuButton } from './menu-manager.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('wizard-engine');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  type: 'selection' | 'input' | 'preview' | 'confirm';
  options?: WizardOption[];
  validator?: (value: any) => Promise<ValidationResult>;
  renderer?: (state: WizardState) => Promise<Menu>;
}

export interface WizardOption {
  id: string;
  label: string;
  emoji?: string;
  value: any;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

export interface WizardState {
  userId: number;
  chatId: number;
  wizardType: string;
  currentStep: string;
  selections: Record<string, any>;
  messageId?: number;
  expiresAt: number;
  createdAt: number;
}

export interface WizardConfig {
  type: string;
  steps: WizardStep[];
  onComplete: (state: WizardState) => Promise<void>;
  onCancel?: (state: WizardState) => Promise<void>;
  timeout?: number;  // seconds
}

// ============================================================================
// WizardEngine Class
// ============================================================================

export class WizardEngine {
  private configs: Map<string, WizardConfig>;
  private stateCache: Map<string, WizardState>;

  constructor() {
    this.configs = new Map();
    this.stateCache = new Map();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Register a wizard configuration
   */
  registerWizard(config: WizardConfig): void {
    this.configs.set(config.type, config);
    logger.info('Wizard registered', { type: config.type, steps: config.steps.length });
  }

  /**
   * Start a new wizard
   */
  async startWizard(
    chatId: number,
    userId: number,
    wizardType: string,
    initialData?: Record<string, any>
  ): Promise<boolean> {
    try {
      const config = this.configs.get(wizardType);
      if (!config) {
        logger.error('Wizard type not found', { wizardType });
        return false;
      }

      // Check if wizard already active for user
      const existing = await this.getState(userId, wizardType);
      if (existing) {
        logger.warn('Wizard already active', { userId, wizardType });
        // Cancel existing and start new
        await this.cancelWizard(chatId, userId, wizardType);
      }

      // Create new state
      const timeout = config.timeout || 900; // Default 15 minutes
      const state: WizardState = {
        userId,
        chatId,
        wizardType,
        currentStep: config.steps[0].id,
        selections: initialData || {},
        expiresAt: Date.now() + (timeout * 1000),
        createdAt: Date.now()
      };

      // Save state
      await this.saveState(state);

      // Show first step
      await this.showCurrentStep(state);

      logger.info('Wizard started', { userId, wizardType, firstStep: state.currentStep });
      return true;
    } catch (error) {
      logger.error('Error starting wizard', error);
      return false;
    }
  }

  /**
   * Handle wizard callback
   */
  async handleCallback(
    chatId: number,
    userId: number,
    callbackData: string
  ): Promise<boolean> {
    try {
      // Parse callback: wizard_<type>_<action>_<value>
      const parts = callbackData.split('_');
      if (parts[0] !== 'wizard' || parts.length < 3) {
        return false;
      }

      const wizardType = parts[1];
      const action = parts[2];
      const value = parts.slice(3).join('_');

      // Get wizard state
      const state = await this.getState(userId, wizardType);
      if (!state) {
        logger.warn('Wizard state not found', { userId, wizardType });
        return false;
      }

      // Check expiration
      if (Date.now() > state.expiresAt) {
        logger.warn('Wizard expired', { userId, wizardType });
        await this.cancelWizard(chatId, userId, wizardType);
        return false;
      }

      // Handle action
      switch (action) {
        case 'select':
          return await this.handleSelection(state, value);
        
        case 'next':
          return await this.nextStep(state);
        
        case 'back':
          return await this.previousStep(state);
        
        case 'confirm':
          return await this.confirmWizard(state);
        
        case 'cancel':
          return await this.cancelWizard(chatId, userId, wizardType);
        
        default:
          logger.warn('Unknown wizard action', { action });
          return false;
      }
    } catch (error) {
      logger.error('Error handling wizard callback', error);
      return false;
    }
  }

  /**
   * Handle text input for current step
   */
  async handleInput(
    chatId: number,
    userId: number,
    wizardType: string,
    input: string
  ): Promise<boolean> {
    try {
      const state = await this.getState(userId, wizardType);
      if (!state) return false;

      const config = this.configs.get(wizardType);
      if (!config) return false;

      const step = config.steps.find(s => s.id === state.currentStep);
      if (!step || step.type !== 'input') {
        logger.warn('Current step does not accept input', { step: state.currentStep });
        return false;
      }

      // Validate input
      if (step.validator) {
        const validation = await step.validator(input);
        if (!validation.valid) {
          // Send error message
          await this.showValidationError(state, validation.error || 'Invalid input');
          return true;
        }
        // Use sanitized value if provided
        input = validation.sanitized || input;
      }

      // Save input
      state.selections[state.currentStep] = input;
      await this.saveState(state);

      // Move to next step
      return await this.nextStep(state);
    } catch (error) {
      logger.error('Error handling wizard input', error);
      return false;
    }
  }

  /**
   * Cancel a wizard
   */
  async cancelWizard(
    chatId: number,
    userId: number,
    wizardType: string
  ): Promise<boolean> {
    try {
      const state = await this.getState(userId, wizardType);
      if (!state) return false;

      const config = this.configs.get(wizardType);
      
      // Call onCancel if defined
      if (config?.onCancel) {
        await config.onCancel(state);
      }

      // Clean up menu
      await menuManager.cleanup(userId, chatId);

      // Delete state
      await this.deleteState(userId, wizardType);

      logger.info('Wizard cancelled', { userId, wizardType });
      return true;
    } catch (error) {
      logger.error('Error cancelling wizard', error);
      return false;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get wizard state
   */
  private async getState(userId: number, wizardType: string): Promise<WizardState | null> {
    const cacheKey = `${userId}_${wizardType}`;
    
    // Check cache
    if (this.stateCache.has(cacheKey)) {
      return this.stateCache.get(cacheKey)!;
    }

    // Load from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) return null;

    const { data, error } = await supabase
      .from('telegram_wizard_state')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('wizard_type', wizardType)
      .single();

    if (error || !data) return null;

    const state: WizardState = {
      userId,
      chatId: data.chatId || 0,  // Fallback
      wizardType: data.wizard_type,
      currentStep: data.current_step,
      selections: data.selections || {},
      messageId: data.message_id,
      expiresAt: new Date(data.expires_at).getTime(),
      createdAt: Date.now()
    };

    this.stateCache.set(cacheKey, state);
    return state;
  }

  /**
   * Save wizard state
   */
  private async saveState(state: WizardState): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('telegram_id', state.userId)
        .single();
      
      if (!profile) {
        logger.warn('Profile not found', { telegram_id: state.userId });
        return;
      }

      const { error } = await supabase
        .from('telegram_wizard_state')
        .upsert({
          user_id: profile.user_id,
          wizard_type: state.wizardType,
          current_step: state.currentStep,
          selections: state.selections,
          message_id: state.messageId,
          expires_at: new Date(state.expiresAt).toISOString()
        });

      if (error) {
        logger.error('Failed to save wizard state', error);
      }

      // Update cache
      const cacheKey = `${state.userId}_${state.wizardType}`;
      this.stateCache.set(cacheKey, state);
    } catch (error) {
      logger.error('Error saving wizard state', error);
    }
  }

  /**
   * Delete wizard state
   */
  private async deleteState(userId: number, wizardType: string): Promise<void> {
    const cacheKey = `${userId}_${wizardType}`;
    this.stateCache.delete(cacheKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();
    
    if (profile) {
      await supabase
        .from('telegram_wizard_state')
        .delete()
        .eq('user_id', profile.user_id)
        .eq('wizard_type', wizardType);
    }
  }

  /**
   * Show current wizard step
   */
  private async showCurrentStep(state: WizardState): Promise<void> {
    const config = this.configs.get(state.wizardType);
    if (!config) return;

    const step = config.steps.find(s => s.id === state.currentStep);
    if (!step) return;

    // Use custom renderer if provided
    if (step.renderer) {
      const menu = await step.renderer(state);
      const messageId = await menuManager.showMenu(state.chatId, state.userId, menu);
      if (messageId) {
        state.messageId = messageId;
        await this.saveState(state);
      }
      return;
    }

    // Default rendering
    const menu = this.buildStepMenu(state, step, config);
    const messageId = await menuManager.showMenu(state.chatId, state.userId, menu);
    if (messageId) {
      state.messageId = messageId;
      await this.saveState(state);
    }
  }

  /**
   * Build menu for a step
   */
  private buildStepMenu(state: WizardState, step: WizardStep, config: WizardConfig): Menu {
    const stepIndex = config.steps.findIndex(s => s.id === step.id);
    const totalSteps = config.steps.length;
    const progress = `Шаг ${stepIndex + 1}/${totalSteps}`;

    const buttons: MenuButton[][] = [];

    // Add options for selection type
    if (step.type === 'selection' && step.options) {
      const optionRows = step.options.map(opt => [{
        text: opt.label,
        emoji: opt.emoji,
        action: 'callback' as const,
        data: `wizard_${state.wizardType}_select_${opt.id}`
      }]);
      buttons.push(...optionRows);
    }

    // Add navigation buttons
    const navButtons: MenuButton[] = [];
    
    if (stepIndex > 0) {
      navButtons.push({
        text: 'Назад',
        emoji: '⬅️',
        action: 'callback',
        data: `wizard_${state.wizardType}_back`
      });
    }

    if (step.type === 'confirm') {
      navButtons.push({
        text: 'Подтвердить',
        emoji: '✅',
        action: 'callback',
        data: `wizard_${state.wizardType}_confirm`
      });
    } else if (step.type === 'preview') {
      navButtons.push({
        text: 'Далее',
        emoji: '➡️',
        action: 'callback',
        data: `wizard_${state.wizardType}_next`
      });
    }

    navButtons.push({
      text: 'Отмена',
      emoji: '❌',
      action: 'callback',
      data: `wizard_${state.wizardType}_cancel`
    });

    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }

    return {
      id: `wizard_${state.wizardType}_${step.id}`,
      title: `${step.title}\n${progress}`,
      description: step.description,
      buttons,
      context: {
        path: ['wizard', state.wizardType, step.id],
        data: state.selections,
        timestamp: Date.now()
      },
      options: {
        autoReplace: true,
        autoDelete: false,
        timeout: 900
      }
    };
  }

  /**
   * Handle selection
   */
  private async handleSelection(state: WizardState, optionId: string): Promise<boolean> {
    const config = this.configs.get(state.wizardType);
    if (!config) return false;

    const step = config.steps.find(s => s.id === state.currentStep);
    if (!step || step.type !== 'selection') return false;

    const option = step.options?.find(o => o.id === optionId);
    if (!option) return false;

    // Save selection
    state.selections[state.currentStep] = option.value;
    await this.saveState(state);

    // Move to next step
    return await this.nextStep(state);
  }

  /**
   * Move to next step
   */
  private async nextStep(state: WizardState): Promise<boolean> {
    const config = this.configs.get(state.wizardType);
    if (!config) return false;

    const currentIndex = config.steps.findIndex(s => s.id === state.currentStep);
    if (currentIndex === -1) return false;

    // Check if last step
    if (currentIndex >= config.steps.length - 1) {
      return await this.confirmWizard(state);
    }

    // Move to next step
    state.currentStep = config.steps[currentIndex + 1].id;
    await this.saveState(state);
    await this.showCurrentStep(state);

    return true;
  }

  /**
   * Move to previous step
   */
  private async previousStep(state: WizardState): Promise<boolean> {
    const config = this.configs.get(state.wizardType);
    if (!config) return false;

    const currentIndex = config.steps.findIndex(s => s.id === state.currentStep);
    if (currentIndex <= 0) return false;

    // Move to previous step
    state.currentStep = config.steps[currentIndex - 1].id;
    await this.saveState(state);
    await this.showCurrentStep(state);

    return true;
  }

  /**
   * Confirm and complete wizard
   */
  private async confirmWizard(state: WizardState): Promise<boolean> {
    try {
      const config = this.configs.get(state.wizardType);
      if (!config) return false;

      // Call onComplete
      await config.onComplete(state);

      // Clean up
      await menuManager.cleanup(state.userId, state.chatId);
      await this.deleteState(state.userId, state.wizardType);

      logger.info('Wizard completed', { userId: state.userId, wizardType: state.wizardType });
      return true;
    } catch (error) {
      logger.error('Error completing wizard', error);
      return false;
    }
  }

  /**
   * Show validation error
   */
  private async showValidationError(state: WizardState, error: string): Promise<void> {
    // This would send an ephemeral error message
    // For now, just log
    logger.warn('Validation error', { userId: state.userId, error });
  }

  /**
   * Periodic cleanup of expired wizards
   */
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      const now = Date.now();
      
      for (const [key, state] of this.stateCache.entries()) {
        if (now > state.expiresAt) {
          const [userIdStr, wizardType] = key.split('_');
          const userId = parseInt(userIdStr);
          await this.cancelWizard(state.chatId, userId, wizardType);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const wizardEngine = new WizardEngine();
