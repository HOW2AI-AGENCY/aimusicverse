import { BOT_CONFIG } from "../config.ts";
import type { InlineKeyboardButton } from "../telegram-api.ts";

export function createShareTrackKeyboard(trackId: string) {
  return {
    inline_keyboard: [
      [
        { text: "📤 Поделиться в историю", callback_data: `share_story_${trackId}` },
        { text: "👥 Поделиться с друзьями", switch_inline_query: `track_${trackId}` },
      ],
      [
        { text: "💬 Отправить в чат", callback_data: `send_to_chat_${trackId}` },
        { text: "📋 Копировать ссылку", callback_data: `copy_link_${trackId}` },
      ],
      [{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }],
    ] as InlineKeyboardButton[][],
  };
}

export function createTrackDetailsKeyboard(trackId: string) {
  return {
    inline_keyboard: [
      [
        { text: "▶️ Слушать", callback_data: `play_track_${trackId}` },
        { text: "⬇️ Скачать", callback_data: `download_track_${trackId}` },
      ],
      [
        { text: "📤 Поделиться", callback_data: `share_menu_${trackId}` },
        { text: "➕ В плейлист", callback_data: `add_playlist_${trackId}` },
      ],
      [
        { text: "📝 Текст", callback_data: `lyrics_${trackId}` },
        { text: "📊 Статистика", callback_data: `stats_${trackId}` },
      ],
      [{ text: "⬅️ Библиотека", callback_data: "library" }],
    ] as InlineKeyboardButton[][],
  };
}

export function createNotificationSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔔 Все уведомления", callback_data: "notify_all" },
        { text: "🔕 Отключить все", callback_data: "notify_none" },
      ],
      [
        { text: "✅ Только готовые треки", callback_data: "notify_completed" },
        { text: "❌ Только ошибки", callback_data: "notify_errors" },
      ],
      [{ text: "⬅️ Настройки", callback_data: "settings" }],
    ] as InlineKeyboardButton[][],
  };
}

export function createSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔔 Уведомления", callback_data: "settings_notifications" },
        { text: "🎨 Эмодзи статус", callback_data: "settings_emoji_status" },
      ],
      [
        { text: "🌐 Язык", callback_data: "settings_language" },
        { text: "🎵 Качество аудио", callback_data: "settings_quality" },
      ],
      [{ text: "⬅️ Главное меню", callback_data: "main_menu" }],
    ] as InlineKeyboardButton[][],
  };
}

export function createEmojiStatusKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🎵 Слушаю музыку", callback_data: "emoji_listening" },
        { text: "🎼 Создаю треки", callback_data: "emoji_creating" },
      ],
      [
        { text: "🎧 В наушниках", callback_data: "emoji_headphones" },
        { text: "🎸 Рок-звезда", callback_data: "emoji_rockstar" },
      ],
      [
        { text: "🎹 Композитор", callback_data: "emoji_composer" },
        { text: "🎤 Певец", callback_data: "emoji_singer" },
      ],
      [
        { text: "🔇 Убрать статус", callback_data: "emoji_remove" },
        { text: "⬅️ Назад", callback_data: "settings" },
      ],
    ] as InlineKeyboardButton[][],
  };
}
