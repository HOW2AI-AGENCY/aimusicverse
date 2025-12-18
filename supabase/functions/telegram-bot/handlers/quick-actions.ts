/**
 * Quick Actions handler - Fast generation and common operations
 */

import { sendPhoto, editMessageMedia, answerCallbackQuery, sendMessage } from '../telegram-api.ts';
import { buildMessage } from '../utils/message-formatter.ts';
import { getMenuImage } from '../keyboards/menu-images.ts';
import { BOT_CONFIG } from '../config.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { 
  createQuickActionsKeyboard, 
  createQuickGenConfirmKeyboard, 
  getPresetById,
  QUICK_PRESETS
} from '../keyboards/quick-actions.ts';
import { navigateTo } from '../core/navigation-state.ts';
import { setActiveMenuMessageId } from '../core/active-menu-manager.ts';

export async function handleQuickActions(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  navigateTo(userId, 'quick_actions', messageId);

  const caption = buildMessage({
    title: 'Быстрые действия',
    emoji: '⚡',
    description: 'Выберите стиль для быстрой генерации или действие',
    sections: [
      {
        title: 'Популярные стили',
        content: 'Нажмите на стиль для мгновенной генерации',
        emoji: '🎵'
      }
    ]
  });

  const keyboard = createQuickActionsKeyboard();
  const menuImage = await getMenuImage('generator');

  if (messageId) {
    await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: menuImage,
        caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );
    await setActiveMenuMessageId(userId, chatId, messageId, 'quick_actions');
  } else {
    const result = await sendPhoto(chatId, menuImage, {
      caption,
      replyMarkup: keyboard
    });

    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, 'menu', 'main_menu');
      await setActiveMenuMessageId(userId, chatId, result.result.message_id, 'main_menu');
    }
  }
}

export async function handleQuickGenPreset(
  chatId: number,
  userId: number,
  presetId: string,
  messageId?: number
): Promise<void> {
  const preset = getPresetById(presetId);
  if (!preset) {
    await sendMessage(chatId, '❌ Пресет не найден', undefined, null);
    return;
  }

  const caption = buildMessage({
    title: `${preset.emoji} ${preset.name}`,
    emoji: '🎵',
    description: preset.description,
    sections: [
      {
        title: 'Стиль',
        content: preset.style,
        emoji: '🎼'
      },
      {
        title: 'Готовы к генерации?',
        content: 'Нажмите "Генерировать" или измените описание в приложении',
        emoji: '💡'
      }
    ]
  });

  const keyboard = createQuickGenConfirmKeyboard(presetId);
  if (!keyboard) return;

  const menuImage = await getMenuImage('generator');

  if (messageId) {
    await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: menuImage,
        caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );
  } else {
    await sendPhoto(chatId, menuImage, {
      caption,
      replyMarkup: keyboard
    });
  }
}

export async function handleConfirmQuickGen(
  chatId: number,
  userId: number,
  presetId: string
): Promise<void> {
  const preset = getPresetById(presetId);
  if (!preset) {
    await sendMessage(chatId, '❌ Пресет не найден', undefined, null);
    return;
  }

  // Import generate handler and start generation
  const { handleGenerate } = await import('../commands/generate.ts');
  await handleGenerate(chatId, userId, preset.style);
}

export async function handleQuickActionsCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  if (callbackData === 'quick_actions') {
    await answerCallbackQuery(queryId);
    await handleQuickActions(chatId, userId, messageId);
    return true;
  }

  if (callbackData === 'check_status') {
    await answerCallbackQuery(queryId);
    const { handleStatus } = await import('../commands/status.ts');
    await handleStatus(chatId, userId);
    return true;
  }

  // Quick generation preset selected
  const quickGenMatch = callbackData.match(/^quick_gen_(\w+)$/);
  if (quickGenMatch) {
    await answerCallbackQuery(queryId);
    await handleQuickGenPreset(chatId, userId, quickGenMatch[1], messageId);
    return true;
  }

  // Confirm quick generation
  const confirmMatch = callbackData.match(/^confirm_quick_gen_(\w+)$/);
  if (confirmMatch) {
    await answerCallbackQuery(queryId, '🎵 Генерация начинается...');
    await handleConfirmQuickGen(chatId, userId, confirmMatch[1]);
    return true;
  }

  return false;
}
