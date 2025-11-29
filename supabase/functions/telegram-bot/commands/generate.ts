import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { sendMessage } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleGenerate(chatId: number, userId: number, prompt: string) {
  if (!prompt || prompt.trim().length === 0) {
    await sendMessage(chatId, '❌ Укажите описание трека.\n\nПример:\n/generate энергичный рок трек\n/generate --instrumental --model=V5 ambient space music');
    return;
  }

  try {
    // Parse command options
    let mode = 'simple';
    let instrumental = false;
    let model = 'V4_5ALL';
    let actualPrompt = prompt;

    // Check for flags
    const flagRegex = /--([\w]+)(?:=(\S+))?/g;
    let match;
    const flags: Record<string, string> = {};
    
    while ((match = flagRegex.exec(prompt)) !== null) {
      flags[match[1]] = match[2] || 'true';
      actualPrompt = actualPrompt.replace(match[0], '').trim();
    }

    if (flags.instrumental) instrumental = true;
    if (flags.mode) mode = flags.mode;
    if (flags.model) model = flags.model.toUpperCase();

    // Check for inline mode indicators
    if (actualPrompt.toLowerCase().includes('[custom]')) {
      mode = 'custom';
      actualPrompt = actualPrompt.replace(/\[custom\]/i, '').trim();
    }

    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Пользователь не найден. Сначала откройте Mini App.');
      return;
    }

    // Show generation starting message with details
    const modeEmoji = mode === 'custom' ? '🎨' : '⚡';
    const modelEmoji = model === 'V5' ? '🚀' : '🎵';
    const typeEmoji = instrumental ? '🎸' : '🎤';
    
    await sendMessage(
      chatId, 
      `${modeEmoji} Запускаю генерацию...\n\n${modelEmoji} Модель: ${model}\n${typeEmoji} Тип: ${instrumental ? 'Инструментал' : 'С вокалом'}\n💭 ${actualPrompt.substring(0, 100)}${actualPrompt.length > 100 ? '...' : ''}`
    );

    // Call new suno-music-generate function
    const { data, error: generateError } = await supabase.functions.invoke('suno-music-generate', {
      body: {
        mode,
        instrumental,
        model,
        prompt: actualPrompt,
        style: mode === 'custom' ? actualPrompt : undefined,
      },
    });

    if (generateError) {
      console.error('Generation error:', generateError);
      await sendMessage(chatId, MESSAGES.generationError);
      return;
    }

    await sendMessage(
      chatId, 
      `✅ Генерация началась!\n\n⏳ Обычно занимает 1-3 минуты\n🔔 Вы получите уведомление когда трек будет готов`
    );

  } catch (error) {
    console.error('Error in generate command:', error);
    await sendMessage(chatId, MESSAGES.generationError);
  }
}
