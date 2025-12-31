/**
 * /app command - open Mini App
 */

import { sendMessage } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { buildMessage } from '../utils/message-formatter.ts';

export async function handleApp(chatId: number) {
  const message = buildMessage({
    title: 'MusicVerse Studio',
    emoji: '📱',
    description: 'Откройте полноценное приложение для создания музыки',
    sections: [
      {
        title: 'Возможности приложения',
        content: [
          'Расширенный генератор треков',
          'Полноценная студия с эффектами',
          'Библиотека с плейлистами',
          'AI-ассистент для текстов'
        ],
        emoji: '✨',
        style: 'list'
      }
    ]
  });
  
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть MusicVerse',
      emoji: '🚀',
      action: { type: 'webapp', url: BOT_CONFIG.miniAppUrl }
    })
    .addRow(
      {
        text: 'Генератор',
        emoji: '🎼',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
      },
      {
        text: 'Библиотека',
        emoji: '📚',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/library` }
      }
    )
    .addRow(
      {
        text: 'Студия',
        emoji: '🎛️',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/studio-v2` }
      },
      {
        text: 'Проекты',
        emoji: '📁',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/projects` }
      }
    )
    .build();
  
  await sendMessage(chatId, message, keyboard, 'MarkdownV2');
}
