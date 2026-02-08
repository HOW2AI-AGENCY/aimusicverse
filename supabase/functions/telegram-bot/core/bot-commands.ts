/**
 * Bot commands configuration and management
 */

import { setMyCommands } from '../telegram-api.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CHANNEL_USERNAME } from '../config.ts';

export interface BotCommand {
  command: string;
  description: string;
  category: 'main' | 'generation' | 'analysis' | 'library' | 'settings' | 'admin';
  enabled: boolean;
}

// Build default commands dynamically
function buildDefaultCommands(): BotCommand[] {
  return [
    // Main commands
    { command: 'start', description: '🚀 Начать работу', category: 'main', enabled: true },
    { command: 'help', description: '📚 Справка по командам', category: 'main', enabled: true },
    { command: 'app', description: '📱 Открыть приложение', category: 'main', enabled: true },
    { command: 'channel', description: `📢 Канал @${CHANNEL_USERNAME}`, category: 'main', enabled: true },
    { command: 'news', description: '📰 Новости платформы', category: 'main', enabled: true },
    
    // Generation commands
    { command: 'generate', description: '🎼 Создать трек', category: 'generation', enabled: true },
    { command: 'cover', description: '🎤 Создать кавер (аудио)', category: 'generation', enabled: true },
    { command: 'extend', description: '➕ Расширить трек (аудио)', category: 'generation', enabled: true },
    { command: 'status', description: '📊 Статус генерации', category: 'generation', enabled: true },
    
    // Analysis commands
    { command: 'analyze', description: '🔬 Меню анализа аудио', category: 'analysis', enabled: true },
    { command: 'midi', description: '🎹 Конвертация в MIDI', category: 'analysis', enabled: true },
    { command: 'piano', description: '🎹 Фортепианная аранжировка', category: 'analysis', enabled: true },
    { command: 'guitar', description: '🎸 Анализ гитарной партии', category: 'analysis', enabled: true },
    { command: 'recognize', description: '🔍 Распознать музыку', category: 'analysis', enabled: true },
    
    // Library commands
    { command: 'library', description: '📚 Мои треки', category: 'library', enabled: true },
    { command: 'projects', description: '📁 Мои проекты', category: 'library', enabled: true },
    { command: 'upload', description: '📤 Загрузить аудио', category: 'library', enabled: true },
    { command: 'uploads', description: '📂 Мои загрузки', category: 'library', enabled: true },
    
    // Settings commands
    { command: 'buy', description: '💎 Купить кредиты', category: 'settings', enabled: true },
    { command: 'cancel', description: '❌ Отменить загрузку', category: 'settings', enabled: true },
    { command: 'terms', description: '📜 Пользовательское соглашение', category: 'settings', enabled: true },
    { command: 'privacy', description: '🔒 Политика конфиденциальности', category: 'settings', enabled: true },
  ];
}

// Default bot commands (lazily initialized to use dynamic config)
export const DEFAULT_COMMANDS: BotCommand[] = buildDefaultCommands();

/**
 * Get commands from database or use defaults
 */
export async function getBotCommands(): Promise<BotCommand[]> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('telegram_bot_config')
      .select('config_value')
      .eq('config_key', 'commands')
      .single();

    if (error || !data) {
      return DEFAULT_COMMANDS;
    }

    return data.config_value as BotCommand[];
  } catch (e) {
    console.error('Failed to get bot commands:', e);
    return DEFAULT_COMMANDS;
  }
}

/**
 * Update bot commands in Telegram
 */
export async function updateBotCommands(): Promise<boolean> {
  try {
    const commands = await getBotCommands();
    
    // Filter enabled commands and format for Telegram API
    const telegramCommands = commands
      .filter(cmd => cmd.enabled)
      .map(cmd => ({
        command: cmd.command,
        description: cmd.description,
      }));

    await setMyCommands(telegramCommands);
    return true;
  } catch (e) {
    console.error('Failed to update bot commands:', e);
    return false;
  }
}

/**
 * Save commands to database
 */
export async function saveBotCommands(commands: BotCommand[]): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('telegram_bot_config')
      .upsert({
        config_key: 'commands',
        config_value: commands,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to save bot commands:', error);
      return false;
    }

    // Update commands in Telegram
    return await updateBotCommands();
  } catch (e) {
    console.error('Failed to save bot commands:', e);
    return false;
  }
}
