/**
 * Generation Wizard - Step-by-step music generation flow
 * Provides an intuitive interface for creating music via Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { wizardEngine, type WizardConfig, type WizardStep, type WizardState } from '../core/wizard-engine.ts';
import { sendMessage } from '../telegram-api.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('generation-wizard');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// Register the wizard
wizardEngine.registerWizard({
  type: 'generation',
  steps: [],
  onComplete: async (state: WizardState) => {
    await sendMessage(state.chatId, '✅ Генерация запущена!');
  },
  timeout: 900
});

logger.info('Generation wizard initialized');
