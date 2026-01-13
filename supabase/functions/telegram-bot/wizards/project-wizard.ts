/**
 * Project Creation Wizard - Step-by-step project creation flow
 * Provides an intuitive interface for creating music projects via Telegram bot
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('project-wizard');

const supabase = getSupabaseClient();

const MINI_APP_URL = BOT_CONFIG.miniAppUrl;

// Wizard state storage (in-memory, should be moved to Redis/DB for production)
const wizardStates = new Map<number, ProjectWizardState>();

export interface ProjectWizardState {
  step: 'title' | 'type' | 'genre' | 'mood' | 'description' | 'confirm';
  userId: number;
  chatId: number;
  messageId?: number;
  data: {
    title?: string;
    projectType?: string;
    genre?: string;
    mood?: string;
    description?: string;
  };
  createdAt: number;
}

const PROJECT_TYPES = [
  { value: 'single', label: 'Сингл', emoji: '🎵', description: '1-2 трека' },
  { value: 'ep', label: 'EP', emoji: '💿', description: '3-6 треков' },
  { value: 'album', label: 'Альбом', emoji: '📀', description: '7+ треков' },
  { value: 'mixtape', label: 'Микстейп', emoji: '🎚️', description: 'Свободный формат' },
];

const GENRES = [
  { value: 'pop', label: 'Pop', emoji: '🎤' },
  { value: 'rock', label: 'Rock', emoji: '🎸' },
  { value: 'hiphop', label: 'Hip-Hop', emoji: '🎤' },
  { value: 'electronic', label: 'Electronic', emoji: '🎹' },
  { value: 'rnb', label: 'R&B', emoji: '🎷' },
  { value: 'jazz', label: 'Jazz', emoji: '🎺' },
  { value: 'classical', label: 'Classical', emoji: '🎻' },
  { value: 'other', label: 'Другой', emoji: '🎵' },
];

const MOODS = [
  { value: 'energetic', label: 'Энергичный', emoji: '⚡' },
  { value: 'chill', label: 'Расслабленный', emoji: '😌' },
  { value: 'dark', label: 'Мрачный', emoji: '🌙' },
  { value: 'happy', label: 'Весёлый', emoji: '😊' },
  { value: 'sad', label: 'Грустный', emoji: '😢' },
  { value: 'romantic', label: 'Романтичный', emoji: '💕' },
  { value: 'aggressive', label: 'Агрессивный', emoji: '🔥' },
  { value: 'dreamy', label: 'Мечтательный', emoji: '✨' },
];

/**
 * Start project creation wizard
 */
export async function startProjectWizard(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  // Initialize wizard state
  const state: ProjectWizardState = {
    step: 'title',
    userId,
    chatId,
    messageId,
    data: {},
    createdAt: Date.now(),
  };
  
  wizardStates.set(userId, state);
  
  const text = `📁 *Создание нового проекта*\n\n` +
    `Шаг 1 из 5: *Название*\n\n` +
    `Введите название вашего проекта:`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    const result = await sendMessage(chatId, text, keyboard);
    if (result?.result?.message_id) {
      state.messageId = result.result.message_id;
      wizardStates.set(userId, state);
    }
  }
  
  logger.info('Project wizard started', { userId, chatId });
}

/**
 * Handle text input during wizard
 */
export async function handleWizardTextInput(
  chatId: number,
  userId: number,
  text: string
): Promise<boolean> {
  const state = wizardStates.get(userId);
  if (!state) return false;

  switch (state.step) {
    case 'title':
      return await handleTitleInput(state, text);
    case 'description':
      return await handleDescriptionInput(state, text);
    default:
      return false;
  }
}

/**
 * Handle title input
 */
async function handleTitleInput(state: ProjectWizardState, title: string): Promise<boolean> {
  if (title.length < 2 || title.length > 100) {
    await sendMessage(state.chatId, '❌ Название должно быть от 2 до 100 символов');
    return true;
  }

  state.data.title = title;
  state.step = 'type';
  wizardStates.set(state.userId, state);

  await showTypeSelection(state);
  return true;
}

/**
 * Show project type selection
 */
async function showTypeSelection(state: ProjectWizardState): Promise<void> {
  const text = `📁 *${escapeMarkdownV2(state.data.title || 'Новый проект')}*\n\n` +
    `Шаг 2 из 5: *Тип проекта*\n\n` +
    `Выберите тип музыкального проекта:`;

  const keyboard = {
    inline_keyboard: [
      ...PROJECT_TYPES.map(type => ([{
        text: `${type.emoji} ${type.label} (${type.description})`,
        callback_data: `wizard_type_${type.value}`,
      }])),
      [{ text: '◀️ Назад', callback_data: 'wizard_back_title' }],
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  if (state.messageId) {
    await editMessageText(state.chatId, state.messageId, text, keyboard);
  } else {
    await sendMessage(state.chatId, text, keyboard);
  }
}

/**
 * Handle wizard callback queries
 */
export async function handleWizardCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string
): Promise<boolean> {
  const state = wizardStates.get(userId);
  
  // Handle cancel from any state
  if (callbackData === 'wizard_cancel') {
    wizardStates.delete(userId);
    await editMessageText(chatId, messageId, '❌ Создание проекта отменено\\.', {
      inline_keyboard: [[{ text: '🔙 В меню', callback_data: 'nav_main' }]],
    });
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle start new wizard
  if (callbackData === 'wizard_start_project') {
    await startProjectWizard(chatId, userId, messageId);
    await answerCallbackQuery(callbackId);
    return true;
  }

  if (!state) return false;

  // Update message id if needed
  state.messageId = messageId;

  // Handle type selection
  if (callbackData.startsWith('wizard_type_')) {
    const type = callbackData.replace('wizard_type_', '');
    state.data.projectType = type;
    state.step = 'genre';
    wizardStates.set(userId, state);
    await showGenreSelection(state);
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle genre selection
  if (callbackData.startsWith('wizard_genre_')) {
    const genre = callbackData.replace('wizard_genre_', '');
    state.data.genre = genre;
    state.step = 'mood';
    wizardStates.set(userId, state);
    await showMoodSelection(state);
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle mood selection
  if (callbackData.startsWith('wizard_mood_')) {
    const mood = callbackData.replace('wizard_mood_', '');
    state.data.mood = mood;
    state.step = 'description';
    wizardStates.set(userId, state);
    await showDescriptionInput(state);
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle skip description
  if (callbackData === 'wizard_skip_description') {
    state.step = 'confirm';
    wizardStates.set(userId, state);
    await showConfirmation(state);
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle back navigation
  if (callbackData.startsWith('wizard_back_')) {
    const target = callbackData.replace('wizard_back_', '');
    await handleBack(state, target);
    await answerCallbackQuery(callbackId);
    return true;
  }

  // Handle confirmation
  if (callbackData === 'wizard_confirm') {
    await createProject(state);
    await answerCallbackQuery(callbackId, '✅ Проект создан!');
    return true;
  }

  return false;
}

/**
 * Show genre selection
 */
async function showGenreSelection(state: ProjectWizardState): Promise<void> {
  const typeInfo = PROJECT_TYPES.find(t => t.value === state.data.projectType);
  
  const text = `📁 *${escapeMarkdownV2(state.data.title || 'Новый проект')}*\n` +
    `${typeInfo?.emoji || '📁'} ${escapeMarkdownV2(typeInfo?.label || 'Проект')}\n\n` +
    `Шаг 3 из 5: *Жанр*\n\n` +
    `Выберите основной жанр:`;

  const keyboard = {
    inline_keyboard: [
      ...chunk(GENRES, 2).map(row => row.map(genre => ({
        text: `${genre.emoji} ${genre.label}`,
        callback_data: `wizard_genre_${genre.value}`,
      }))),
      [{ text: '◀️ Назад', callback_data: 'wizard_back_type' }],
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  await editMessageText(state.chatId, state.messageId!, text, keyboard);
}

/**
 * Show mood selection
 */
async function showMoodSelection(state: ProjectWizardState): Promise<void> {
  const genreInfo = GENRES.find(g => g.value === state.data.genre);
  
  const text = `📁 *${escapeMarkdownV2(state.data.title || 'Новый проект')}*\n` +
    `🎵 Жанр: ${escapeMarkdownV2(genreInfo?.label || state.data.genre || '')}\n\n` +
    `Шаг 4 из 5: *Настроение*\n\n` +
    `Выберите настроение проекта:`;

  const keyboard = {
    inline_keyboard: [
      ...chunk(MOODS, 2).map(row => row.map(mood => ({
        text: `${mood.emoji} ${mood.label}`,
        callback_data: `wizard_mood_${mood.value}`,
      }))),
      [{ text: '◀️ Назад', callback_data: 'wizard_back_genre' }],
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  await editMessageText(state.chatId, state.messageId!, text, keyboard);
}

/**
 * Show description input
 */
async function showDescriptionInput(state: ProjectWizardState): Promise<void> {
  const moodInfo = MOODS.find(m => m.value === state.data.mood);
  
  const text = `📁 *${escapeMarkdownV2(state.data.title || 'Новый проект')}*\n` +
    `${moodInfo?.emoji || '🎵'} ${escapeMarkdownV2(moodInfo?.label || state.data.mood || '')}\n\n` +
    `Шаг 5 из 5: *Описание* \\(опционально\\)\n\n` +
    `Введите краткое описание проекта или нажмите "Пропустить":`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '⏭️ Пропустить', callback_data: 'wizard_skip_description' }],
      [{ text: '◀️ Назад', callback_data: 'wizard_back_mood' }],
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  await editMessageText(state.chatId, state.messageId!, text, keyboard);
}

/**
 * Handle description input
 */
async function handleDescriptionInput(state: ProjectWizardState, description: string): Promise<boolean> {
  if (description.length > 500) {
    await sendMessage(state.chatId, '❌ Описание не должно превышать 500 символов');
    return true;
  }

  state.data.description = description;
  state.step = 'confirm';
  wizardStates.set(state.userId, state);

  await showConfirmation(state);
  return true;
}

/**
 * Show confirmation
 */
async function showConfirmation(state: ProjectWizardState): Promise<void> {
  const typeInfo = PROJECT_TYPES.find(t => t.value === state.data.projectType);
  const genreInfo = GENRES.find(g => g.value === state.data.genre);
  const moodInfo = MOODS.find(m => m.value === state.data.mood);

  const text = `✨ *Подтвердите создание проекта*\n\n` +
    `📁 *${escapeMarkdownV2(state.data.title || 'Новый проект')}*\n\n` +
    `${typeInfo?.emoji || '📁'} *Тип:* ${escapeMarkdownV2(typeInfo?.label || state.data.projectType || '')}\n` +
    `🎵 *Жанр:* ${escapeMarkdownV2(genreInfo?.label || state.data.genre || '')}\n` +
    `${moodInfo?.emoji || '🎵'} *Настроение:* ${escapeMarkdownV2(moodInfo?.label || state.data.mood || '')}\n` +
    (state.data.description ? `\n📝 _${escapeMarkdownV2(state.data.description)}_\n` : '') +
    `\nВсё верно?`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Создать проект', callback_data: 'wizard_confirm' }],
      [{ text: '◀️ Назад', callback_data: 'wizard_back_description' }],
      [{ text: '❌ Отмена', callback_data: 'wizard_cancel' }],
    ],
  };

  await editMessageText(state.chatId, state.messageId!, text, keyboard);
}

/**
 * Handle back navigation
 */
async function handleBack(state: ProjectWizardState, target: string): Promise<void> {
  switch (target) {
    case 'title':
      state.step = 'title';
      await startProjectWizard(state.chatId, state.userId, state.messageId);
      break;
    case 'type':
      state.step = 'type';
      await showTypeSelection(state);
      break;
    case 'genre':
      state.step = 'genre';
      await showGenreSelection(state);
      break;
    case 'mood':
      state.step = 'mood';
      await showMoodSelection(state);
      break;
    case 'description':
      state.step = 'description';
      await showDescriptionInput(state);
      break;
  }
  wizardStates.set(state.userId, state);
}

/**
 * Create the project in database
 */
async function createProject(state: ProjectWizardState): Promise<void> {
  try {
    // Get user_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, subscription_tier')
      .eq('telegram_id', state.userId)
      .single();

    if (profileError || !profile) {
      await sendMessage(state.chatId, '❌ Профиль не найден. Используйте /start для регистрации.');
      wizardStates.delete(state.userId);
      return;
    }

    // Check project limit for free users
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('can_create_project', { _user_id: profile.user_id });

    if (limitError) {
      logger.error('Failed to check project limit', limitError);
    }

    const canCreate = (limitCheck as Record<string, unknown>)?.allowed !== false;
    const limitReason = (limitCheck as Record<string, unknown>)?.reason as string | undefined;

    if (!canCreate) {
      const upgradeText = `⚠️ *Достигнут лимит проектов*\n\n` +
        `${escapeMarkdownV2(limitReason || 'Бесплатные пользователи могут создать до 3 проектов.')}\n\n` +
        `💎 Оформите подписку для безлимитного доступа\\!`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '💎 Оформить подписку', callback_data: 'nav_subscription' }],
          [{ text: '📁 Мои проекты', callback_data: 'nav_projects' }],
        ],
      };
      
      await editMessageText(state.chatId, state.messageId!, upgradeText, keyboard);
      wizardStates.delete(state.userId);
      return;
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('music_projects')
      .insert({
        user_id: profile.user_id,
        title: state.data.title,
        project_type: state.data.projectType,
        genre: state.data.genre,
        mood: state.data.mood,
        description: state.data.description,
        status: 'draft',
        is_public: false,
      })
      .select()
      .single();

    if (projectError) {
      logger.error('Failed to create project', projectError);
      await sendMessage(state.chatId, '❌ Не удалось создать проект. Попробуйте позже.');
      wizardStates.delete(state.userId);
      return;
    }

    const typeInfo = PROJECT_TYPES.find(t => t.value === state.data.projectType);

    const text = `🎉 *Проект успешно создан\\!*\n\n` +
      `📁 *${escapeMarkdownV2(project.title)}*\n` +
      `${typeInfo?.emoji || '📁'} ${escapeMarkdownV2(typeInfo?.label || 'Проект')}\n\n` +
      `✨ Теперь вы можете добавить треки в проект\\!`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📱 Открыть в приложении', url: `${MINI_APP_URL}?startapp=project_${project.id}` }],
        [{ text: '🎼 Сгенерировать трек', callback_data: 'quick_actions' }],
        [{ text: '📁 Мои проекты', callback_data: 'nav_projects' }],
      ],
    };

    await editMessageText(state.chatId, state.messageId!, text, keyboard);
    wizardStates.delete(state.userId);
    
    logger.info('Project created via wizard', { projectId: project.id, userId: state.userId });
  } catch (error) {
    logger.error('Failed to create project', error);
    await sendMessage(state.chatId, '❌ Произошла ошибка. Попробуйте позже.');
    wizardStates.delete(state.userId);
  }
}

/**
 * Check if user has active wizard
 */
export function hasActiveWizard(userId: number): boolean {
  const state = wizardStates.get(userId);
  if (!state) return false;
  
  // Clean up stale wizards (older than 30 minutes)
  if (Date.now() - state.createdAt > 30 * 60 * 1000) {
    wizardStates.delete(userId);
    return false;
  }
  
  return true;
}

/**
 * Get current wizard step
 */
export function getWizardStep(userId: number): string | null {
  return wizardStates.get(userId)?.step || null;
}

/**
 * Cancel user's wizard
 */
export function cancelWizard(userId: number): void {
  wizardStates.delete(userId);
}

/**
 * Utility: chunk array into groups
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
