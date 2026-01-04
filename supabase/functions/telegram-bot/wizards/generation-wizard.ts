/**
 * Generation Wizard - Step-by-step music generation flow
 * 4 Steps: Style → Mood → Details → Confirmation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { escapeMarkdown, trackMetric } from '../utils/index.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('generation-wizard');

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// ============================================================================
// Types
// ============================================================================

interface WizardState {
  step: 'style' | 'mood' | 'details' | 'confirm';
  genre?: string;
  subgenre?: string;
  mood?: string;
  energy?: string;
  details?: string;
  instrumental?: boolean;
  language?: string;
}

interface StyleOption {
  id: string;
  label: string;
  emoji: string;
  subgenres?: { id: string; label: string }[];
}

interface MoodOption {
  id: string;
  label: string;
  emoji: string;
}

// ============================================================================
// Style & Mood Options
// ============================================================================

const STYLE_OPTIONS: StyleOption[] = [
  { 
    id: 'pop', 
    label: 'Pop', 
    emoji: '🎤',
    subgenres: [
      { id: 'dance_pop', label: 'Dance Pop' },
      { id: 'synth_pop', label: 'Synth Pop' },
      { id: 'indie_pop', label: 'Indie Pop' },
      { id: 'k_pop', label: 'K-Pop' },
    ]
  },
  { 
    id: 'rock', 
    label: 'Rock', 
    emoji: '🎸',
    subgenres: [
      { id: 'classic_rock', label: 'Classic Rock' },
      { id: 'indie_rock', label: 'Indie Rock' },
      { id: 'alternative', label: 'Alternative' },
      { id: 'punk', label: 'Punk' },
    ]
  },
  { 
    id: 'electronic', 
    label: 'Electronic', 
    emoji: '🎹',
    subgenres: [
      { id: 'house', label: 'House' },
      { id: 'techno', label: 'Techno' },
      { id: 'edm', label: 'EDM' },
      { id: 'ambient', label: 'Ambient' },
    ]
  },
  { 
    id: 'hiphop', 
    label: 'Hip-Hop', 
    emoji: '🎧',
    subgenres: [
      { id: 'trap', label: 'Trap' },
      { id: 'boom_bap', label: 'Boom Bap' },
      { id: 'lofi_hiphop', label: 'Lo-Fi Hip-Hop' },
      { id: 'drill', label: 'Drill' },
    ]
  },
  { 
    id: 'rnb', 
    label: 'R&B / Soul', 
    emoji: '💜',
    subgenres: [
      { id: 'modern_rnb', label: 'Modern R&B' },
      { id: 'neo_soul', label: 'Neo Soul' },
      { id: 'classic_soul', label: 'Classic Soul' },
    ]
  },
  { 
    id: 'jazz', 
    label: 'Jazz', 
    emoji: '🎷',
    subgenres: [
      { id: 'smooth_jazz', label: 'Smooth Jazz' },
      { id: 'bebop', label: 'Bebop' },
      { id: 'jazz_fusion', label: 'Jazz Fusion' },
    ]
  },
  { 
    id: 'classical', 
    label: 'Classical', 
    emoji: '🎻',
    subgenres: [
      { id: 'orchestral', label: 'Orchestral' },
      { id: 'piano', label: 'Piano' },
      { id: 'cinematic', label: 'Cinematic' },
    ]
  },
  { 
    id: 'folk', 
    label: 'Folk / Acoustic', 
    emoji: '🪕',
    subgenres: [
      { id: 'acoustic', label: 'Acoustic' },
      { id: 'country', label: 'Country' },
      { id: 'singer_songwriter', label: 'Singer-Songwriter' },
    ]
  },
  { 
    id: 'metal', 
    label: 'Metal', 
    emoji: '🤘',
    subgenres: [
      { id: 'heavy_metal', label: 'Heavy Metal' },
      { id: 'death_metal', label: 'Death Metal' },
      { id: 'progressive_metal', label: 'Progressive' },
    ]
  },
  { 
    id: 'latin', 
    label: 'Latin', 
    emoji: '💃',
    subgenres: [
      { id: 'reggaeton', label: 'Reggaeton' },
      { id: 'salsa', label: 'Salsa' },
      { id: 'bachata', label: 'Bachata' },
    ]
  },
];

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy', label: 'Весёлый', emoji: '😊' },
  { id: 'sad', label: 'Грустный', emoji: '😢' },
  { id: 'energetic', label: 'Энергичный', emoji: '⚡' },
  { id: 'calm', label: 'Спокойный', emoji: '😌' },
  { id: 'romantic', label: 'Романтичный', emoji: '💕' },
  { id: 'aggressive', label: 'Агрессивный', emoji: '😤' },
  { id: 'dreamy', label: 'Мечтательный', emoji: '✨' },
  { id: 'dark', label: 'Мрачный', emoji: '🌑' },
  { id: 'uplifting', label: 'Вдохновляющий', emoji: '🌅' },
  { id: 'melancholic', label: 'Меланхоличный', emoji: '🌧️' },
];

const ENERGY_OPTIONS = [
  { id: 'low', label: 'Низкая', emoji: '🔋' },
  { id: 'medium', label: 'Средняя', emoji: '🔋🔋' },
  { id: 'high', label: 'Высокая', emoji: '🔋🔋🔋' },
];

// ============================================================================
// Wizard Functions
// ============================================================================

/**
 * Start the generation wizard
 */
export async function startGenerationWizard(
  chatId: number,
  userId: number
): Promise<void> {
  try {
    // Initialize wizard state
    const state: WizardState = { step: 'style' };
    await saveWizardState(userId, state);
    
    // Show step 1: Style selection
    await showStyleStep(chatId, userId);
    
    trackMetric({
      eventType: 'wizard_started',
      success: true,
      telegramChatId: chatId,
      metadata: { wizardType: 'generation' },
    });
  } catch (error) {
    logger.error('Error starting generation wizard', error);
    await sendMessage(chatId, '❌ Ошибка запуска мастера генерации\\.');
  }
}

/**
 * Handle wizard callback
 */
export async function handleGenerationWizardCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  try {
    // Check if this is a generation wizard callback
    if (!data.startsWith('genwiz_')) {
      return false;
    }
    
    const action = data.replace('genwiz_', '');
    const state = await getWizardState(userId);
    
    if (!state) {
      await answerCallbackQuery(queryId, 'Сессия истекла. Начните заново с /generate');
      return true;
    }
    
    // Handle actions based on current step
    if (action === 'cancel') {
      await cancelWizard(chatId, userId, messageId, queryId);
      return true;
    }
    
    if (action === 'back') {
      await goBack(chatId, userId, messageId, state, queryId);
      return true;
    }
    
    if (action === 'skip_details') {
      state.step = 'confirm';
      await saveWizardState(userId, state);
      await showConfirmStep(chatId, userId, messageId, state);
      await answerCallbackQuery(queryId);
      return true;
    }
    
    if (action === 'toggle_instrumental') {
      state.instrumental = !state.instrumental;
      await saveWizardState(userId, state);
      await showConfirmStep(chatId, userId, messageId, state);
      await answerCallbackQuery(queryId, state.instrumental ? '🎸 Инструментал' : '🎤 С вокалом');
      return true;
    }
    
    if (action === 'confirm_generate') {
      await startGeneration(chatId, userId, messageId, state, queryId);
      return true;
    }
    
    // Handle step-specific selections
    if (action.startsWith('style_')) {
      const styleId = action.replace('style_', '');
      await handleStyleSelection(chatId, userId, messageId, state, styleId, queryId);
      return true;
    }
    
    if (action.startsWith('subgenre_')) {
      const subgenreId = action.replace('subgenre_', '');
      await handleSubgenreSelection(chatId, userId, messageId, state, subgenreId, queryId);
      return true;
    }
    
    if (action.startsWith('mood_')) {
      const moodId = action.replace('mood_', '');
      await handleMoodSelection(chatId, userId, messageId, state, moodId, queryId);
      return true;
    }
    
    if (action.startsWith('energy_')) {
      const energyId = action.replace('energy_', '');
      await handleEnergySelection(chatId, userId, messageId, state, energyId, queryId);
      return true;
    }
    
    await answerCallbackQuery(queryId);
    return true;
    
  } catch (error) {
    logger.error('Error handling wizard callback', error);
    await answerCallbackQuery(queryId, 'Произошла ошибка');
    return true;
  }
}

/**
 * Handle text input during wizard (for details step)
 */
export async function handleWizardTextInput(
  chatId: number,
  userId: number,
  text: string
): Promise<boolean> {
  try {
    const state = await getWizardState(userId);
    
    if (!state || state.step !== 'details') {
      return false;
    }
    
    // Save details and move to confirm
    state.details = text;
    state.step = 'confirm';
    await saveWizardState(userId, state);
    
    await showConfirmStep(chatId, userId, undefined, state);
    return true;
    
  } catch (error) {
    logger.error('Error handling wizard text input', error);
    return false;
  }
}

/**
 * Check if wizard is active for user
 */
export async function hasActiveGenerationWizard(userId: number): Promise<boolean> {
  const state = await getWizardState(userId);
  return state !== null;
}

// ============================================================================
// Step Renderers
// ============================================================================

async function showStyleStep(chatId: number, userId: number, messageId?: number): Promise<void> {
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    '📍 Шаг 1 из 4: *Выберите жанр*\n\n' +
    'Выберите основной музыкальный стиль:';
  
  // Build keyboard with 2 columns
  const rows: any[][] = [];
  for (let i = 0; i < STYLE_OPTIONS.length; i += 2) {
    const row = [];
    row.push({
      text: `${STYLE_OPTIONS[i].emoji} ${STYLE_OPTIONS[i].label}`,
      callback_data: `genwiz_style_${STYLE_OPTIONS[i].id}`
    });
    if (STYLE_OPTIONS[i + 1]) {
      row.push({
        text: `${STYLE_OPTIONS[i + 1].emoji} ${STYLE_OPTIONS[i + 1].label}`,
        callback_data: `genwiz_style_${STYLE_OPTIONS[i + 1].id}`
      });
    }
    rows.push(row);
  }
  
  rows.push([{ text: '❌ Отмена', callback_data: 'genwiz_cancel' }]);
  
  const keyboard = { inline_keyboard: rows };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

async function showSubgenreStep(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState
): Promise<void> {
  const style = STYLE_OPTIONS.find(s => s.id === state.genre);
  if (!style?.subgenres) {
    // Skip to mood if no subgenres
    state.step = 'mood';
    await saveWizardState(userId, state);
    await showMoodStep(chatId, userId, messageId, state);
    return;
  }
  
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    `📍 Шаг 1\\.5: *Уточните стиль*\n\n` +
    `Выбран: ${style.emoji} ${escapeMarkdown(style.label)}\n\n` +
    'Выберите поджанр:';
  
  const rows: any[][] = [];
  for (const sub of style.subgenres) {
    rows.push([{
      text: sub.label,
      callback_data: `genwiz_subgenre_${sub.id}`
    }]);
  }
  
  rows.push([
    { text: '⬅️ Назад', callback_data: 'genwiz_back' },
    { text: '⏩ Пропустить', callback_data: `genwiz_subgenre_skip` }
  ]);
  rows.push([{ text: '❌ Отмена', callback_data: 'genwiz_cancel' }]);
  
  await editMessageText(chatId, messageId, text, { inline_keyboard: rows });
}

async function showMoodStep(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState
): Promise<void> {
  const style = STYLE_OPTIONS.find(s => s.id === state.genre);
  
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    `📍 Шаг 2 из 4: *Выберите настроение*\n\n` +
    `🎸 Стиль: ${style?.emoji || '🎵'} ${escapeMarkdown(style?.label || state.genre || '')}\n` +
    (state.subgenre ? `└ ${escapeMarkdown(state.subgenre)}\n` : '') +
    '\nВыберите настроение трека:';
  
  const rows: any[][] = [];
  for (let i = 0; i < MOOD_OPTIONS.length; i += 2) {
    const row = [];
    row.push({
      text: `${MOOD_OPTIONS[i].emoji} ${MOOD_OPTIONS[i].label}`,
      callback_data: `genwiz_mood_${MOOD_OPTIONS[i].id}`
    });
    if (MOOD_OPTIONS[i + 1]) {
      row.push({
        text: `${MOOD_OPTIONS[i + 1].emoji} ${MOOD_OPTIONS[i + 1].label}`,
        callback_data: `genwiz_mood_${MOOD_OPTIONS[i + 1].id}`
      });
    }
    rows.push(row);
  }
  
  rows.push([
    { text: '⬅️ Назад', callback_data: 'genwiz_back' },
    { text: '❌ Отмена', callback_data: 'genwiz_cancel' }
  ]);
  
  await editMessageText(chatId, messageId, text, { inline_keyboard: rows });
}

async function showEnergyStep(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState
): Promise<void> {
  const style = STYLE_OPTIONS.find(s => s.id === state.genre);
  const mood = MOOD_OPTIONS.find(m => m.id === state.mood);
  
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    `📍 Шаг 3 из 4: *Уровень энергии*\n\n` +
    `🎸 Стиль: ${style?.emoji || '🎵'} ${escapeMarkdown(style?.label || '')}\n` +
    `💫 Настроение: ${mood?.emoji || ''} ${escapeMarkdown(mood?.label || '')}\n\n` +
    'Выберите уровень энергии:';
  
  const rows: any[][] = [];
  for (const energy of ENERGY_OPTIONS) {
    rows.push([{
      text: `${energy.emoji} ${energy.label}`,
      callback_data: `genwiz_energy_${energy.id}`
    }]);
  }
  
  rows.push([
    { text: '⬅️ Назад', callback_data: 'genwiz_back' },
    { text: '❌ Отмена', callback_data: 'genwiz_cancel' }
  ]);
  
  await editMessageText(chatId, messageId, text, { inline_keyboard: rows });
}

async function showDetailsStep(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState
): Promise<void> {
  const style = STYLE_OPTIONS.find(s => s.id === state.genre);
  const mood = MOOD_OPTIONS.find(m => m.id === state.mood);
  const energy = ENERGY_OPTIONS.find(e => e.id === state.energy);
  
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    `📍 Шаг 4 из 4: *Дополнительные детали*\n\n` +
    `🎸 Стиль: ${style?.emoji || '🎵'} ${escapeMarkdown(style?.label || '')}\n` +
    `💫 Настроение: ${mood?.emoji || ''} ${escapeMarkdown(mood?.label || '')}\n` +
    `⚡ Энергия: ${energy?.emoji || ''} ${escapeMarkdown(energy?.label || '')}\n\n` +
    '*Отправьте текстом дополнительные пожелания:*\n' +
    '• О чём должна быть песня?\n' +
    '• Особые инструменты?\n' +
    '• Язык исполнения?\n\n' +
    '_Или нажмите "Пропустить" чтобы сгенерировать без деталей_';
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ Назад', callback_data: 'genwiz_back' },
        { text: '⏩ Пропустить', callback_data: 'genwiz_skip_details' }
      ],
      [{ text: '❌ Отмена', callback_data: 'genwiz_cancel' }]
    ]
  };
  
  await editMessageText(chatId, messageId, text, keyboard);
}

async function showConfirmStep(
  chatId: number,
  userId: number,
  messageId: number | undefined,
  state: WizardState
): Promise<void> {
  const style = STYLE_OPTIONS.find(s => s.id === state.genre);
  const mood = MOOD_OPTIONS.find(m => m.id === state.mood);
  const energy = ENERGY_OPTIONS.find(e => e.id === state.energy);
  
  // Build prompt preview
  const promptParts: string[] = [];
  if (style) promptParts.push(style.label);
  if (state.subgenre) promptParts.push(state.subgenre.replace(/_/g, ' '));
  if (mood) promptParts.push(mood.label.toLowerCase());
  if (energy) promptParts.push(`${energy.label.toLowerCase()} energy`);
  if (state.details) promptParts.push(state.details);
  
  const promptPreview = promptParts.join(', ');
  
  const text = 
    '🎵 *Мастер генерации музыки*\n\n' +
    '✅ *Готово к генерации\\!*\n\n' +
    `🎸 Стиль: ${style?.emoji || '🎵'} ${escapeMarkdown(style?.label || '')}\n` +
    (state.subgenre ? `└ ${escapeMarkdown(state.subgenre.replace(/_/g, ' '))}\n` : '') +
    `💫 Настроение: ${mood?.emoji || ''} ${escapeMarkdown(mood?.label || '')}\n` +
    `⚡ Энергия: ${energy?.emoji || ''} ${escapeMarkdown(energy?.label || '')}\n` +
    `🎤 Тип: ${state.instrumental ? '🎸 Инструментал' : '🎤 С вокалом'}\n` +
    (state.details ? `\n📝 Детали: ${escapeMarkdown(state.details)}\n` : '') +
    `\n🎯 *Промпт:*\n_"${escapeMarkdown(promptPreview)}"_`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: state.instrumental ? '🎸 Инструментал ✓' : '🎤 С вокалом ✓', 
          callback_data: 'genwiz_toggle_instrumental' 
        }
      ],
      [
        { text: '🎵 Сгенерировать!', callback_data: 'genwiz_confirm_generate' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'genwiz_back' },
        { text: '❌ Отмена', callback_data: 'genwiz_cancel' }
      ]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

// ============================================================================
// Action Handlers
// ============================================================================

async function handleStyleSelection(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  styleId: string,
  queryId: string
): Promise<void> {
  state.genre = styleId;
  await saveWizardState(userId, state);
  
  const style = STYLE_OPTIONS.find(s => s.id === styleId);
  await answerCallbackQuery(queryId, `${style?.emoji} ${style?.label}`);
  
  // Check if style has subgenres
  if (style?.subgenres && style.subgenres.length > 0) {
    await showSubgenreStep(chatId, userId, messageId, state);
  } else {
    state.step = 'mood';
    await saveWizardState(userId, state);
    await showMoodStep(chatId, userId, messageId, state);
  }
}

async function handleSubgenreSelection(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  subgenreId: string,
  queryId: string
): Promise<void> {
  if (subgenreId !== 'skip') {
    state.subgenre = subgenreId;
  }
  state.step = 'mood';
  await saveWizardState(userId, state);
  
  await answerCallbackQuery(queryId);
  await showMoodStep(chatId, userId, messageId, state);
}

async function handleMoodSelection(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  moodId: string,
  queryId: string
): Promise<void> {
  state.mood = moodId;
  await saveWizardState(userId, state);
  
  const mood = MOOD_OPTIONS.find(m => m.id === moodId);
  await answerCallbackQuery(queryId, `${mood?.emoji} ${mood?.label}`);
  
  await showEnergyStep(chatId, userId, messageId, state);
}

async function handleEnergySelection(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  energyId: string,
  queryId: string
): Promise<void> {
  state.energy = energyId;
  state.step = 'details';
  await saveWizardState(userId, state);
  
  await answerCallbackQuery(queryId);
  await showDetailsStep(chatId, userId, messageId, state);
}

async function goBack(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  queryId: string
): Promise<void> {
  await answerCallbackQuery(queryId);
  
  switch (state.step) {
    case 'mood':
      state.step = 'style';
      state.genre = undefined;
      state.subgenre = undefined;
      await saveWizardState(userId, state);
      await showStyleStep(chatId, userId, messageId);
      break;
    case 'details':
      state.step = 'mood';
      state.energy = undefined;
      await saveWizardState(userId, state);
      await showMoodStep(chatId, userId, messageId, state);
      break;
    case 'confirm':
      state.step = 'details';
      state.details = undefined;
      await saveWizardState(userId, state);
      await showDetailsStep(chatId, userId, messageId, state);
      break;
    default:
      await showStyleStep(chatId, userId, messageId);
  }
}

async function cancelWizard(
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<void> {
  await deleteWizardState(userId);
  await answerCallbackQuery(queryId, 'Отменено');
  await editMessageText(chatId, messageId, '❌ Генерация отменена\\.');
  
  trackMetric({
    eventType: 'wizard_cancelled',
    success: true,
    telegramChatId: chatId,
    metadata: { wizardType: 'generation' },
  });
}

async function startGeneration(
  chatId: number,
  userId: number,
  messageId: number,
  state: WizardState,
  queryId: string
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();
    
    if (!profile) {
      await answerCallbackQuery(queryId, 'Профиль не найден');
      return;
    }
    
    // Build prompt
    const style = STYLE_OPTIONS.find(s => s.id === state.genre);
    const mood = MOOD_OPTIONS.find(m => m.id === state.mood);
    const energy = ENERGY_OPTIONS.find(e => e.id === state.energy);
    
    const promptParts: string[] = [];
    if (style) promptParts.push(style.label);
    if (state.subgenre) promptParts.push(state.subgenre.replace(/_/g, ' '));
    if (mood) promptParts.push(mood.label.toLowerCase());
    if (energy && state.energy !== 'medium') {
      promptParts.push(`${energy.label.toLowerCase()} energy`);
    }
    if (state.details) promptParts.push(state.details);
    
    const prompt = promptParts.join(', ');
    
    await answerCallbackQuery(queryId, '🎵 Запускаем генерацию!');
    
    // Update message
    await editMessageText(chatId, messageId,
      '🎵 *Генерация началась\\!*\n\n' +
      `📝 ${escapeMarkdown(prompt)}\n` +
      `🎸 Режим: ${state.instrumental ? 'Инструментал' : 'С вокалом'}\n\n` +
      '⏳ Обычно занимает 1\\-3 минуты\\.\n' +
      '🔔 Вы получите уведомление когда трек будет готов\\!'
    );
    
    // Delete wizard state
    await deleteWizardState(userId);
    
    // Call generation function
    const { data: result, error } = await supabase.functions.invoke('suno-generate', {
      body: {
        prompt,
        userId: profile.user_id,
        instrumental: state.instrumental || false,
        source: 'telegram_wizard',
        chatId,
        messageId,
      },
    });
    
    if (error) {
      logger.error('Generation error', error);
      await editMessageText(chatId, messageId,
        '❌ *Ошибка генерации*\n\n' +
        `${escapeMarkdown(error.message || 'Неизвестная ошибка')}\n\n` +
        'Попробуйте ещё раз с командой /generate'
      );
    }
    
    trackMetric({
      eventType: 'wizard_completed',
      success: !error,
      telegramChatId: chatId,
      metadata: { 
        wizardType: 'generation',
        genre: state.genre,
        mood: state.mood,
        instrumental: state.instrumental,
        taskId: result?.task_id,
      },
    });
    
  } catch (error) {
    logger.error('Error starting generation', error);
    await answerCallbackQuery(queryId, 'Ошибка запуска');
  }
}

// ============================================================================
// State Management
// ============================================================================

async function getWizardState(userId: number): Promise<WizardState | null> {
  try {
    const { data } = await supabase
      .from('telegram_bot_sessions')
      .select('options')
      .eq('telegram_user_id', userId)
      .eq('session_type', 'generation_wizard')
      .gt('expires_at', new Date().toISOString())
      .single();
    
    return data?.options as WizardState || null;
  } catch {
    return null;
  }
}

async function saveWizardState(userId: number, state: WizardState): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  await supabase
    .from('telegram_bot_sessions')
    .upsert({
      telegram_user_id: userId,
      session_type: 'generation_wizard',
      options: state,
      expires_at: expiresAt.toISOString(),
    });
}

async function deleteWizardState(userId: number): Promise<void> {
  await supabase
    .from('telegram_bot_sessions')
    .delete()
    .eq('telegram_user_id', userId)
    .eq('session_type', 'generation_wizard');
}

logger.info('Generation wizard module loaded');
