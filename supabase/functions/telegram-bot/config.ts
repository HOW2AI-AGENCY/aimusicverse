import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared Telegram configuration
// Sanitize URL: remove trailing slashes to prevent double-slash issues
const sanitizeUrl = (url: string): string => url.replace(/\/+$/, "");

const getTelegramConfig = () => {
  const botUsername = Deno.env.get("TELEGRAM_BOT_USERNAME") || "AIMusicVerseBot";
  const appShortName = Deno.env.get("TELEGRAM_APP_SHORT_NAME") || "app";
  const rawMiniAppUrl = Deno.env.get("MINI_APP_URL") || `https://t.me/${botUsername}/${appShortName}`;
  const miniAppUrl = sanitizeUrl(rawMiniAppUrl);

  return {
    botUsername,
    appShortName,
    miniAppUrl,
    deepLinkBase: `https://t.me/${botUsername}/${appShortName}`,
  };
};

const telegramConfig = getTelegramConfig();

export const BOT_CONFIG = {
  botToken: Deno.env.get("TELEGRAM_BOT_TOKEN")!,
  botUsername: telegramConfig.botUsername,
  miniAppUrl: telegramConfig.miniAppUrl,
  deepLinkBase: telegramConfig.deepLinkBase,
  supabaseUrl: Deno.env.get("SUPABASE_URL")!,
  supabaseServiceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
};

// Channel configuration
export const CHANNEL_USERNAME = Deno.env.get("TELEGRAM_CHANNEL_USERNAME") || "AIMusiicVerse";
export const CHANNEL_URL = `https://t.me/${CHANNEL_USERNAME}`;

// Support configuration
export const SUPPORT_USERNAME = Deno.env.get("TELEGRAM_SUPPORT_USERNAME") || "MusicVerseSupport";
export const SUPPORT_URL = `https://t.me/${SUPPORT_USERNAME}`;

// News channel
export const NEWS_CHANNEL_USERNAME = Deno.env.get("TELEGRAM_NEWS_CHANNEL") || "MusicVerseAI";
export const NEWS_CHANNEL_URL = `https://t.me/${NEWS_CHANNEL_USERNAME}`;

// Default messages - will be overridden by database config
// Uses dynamic channel username from environment
const DEFAULT_MESSAGES = {
  welcome: `🎵 *Добро пожаловать в MusicVerse\\!*

Создавайте профессиональную музыку с помощью AI прямо в Telegram\\! 🚀

📢 *Подпишитесь на канал:* @${CHANNEL_USERNAME}
• Новости и обновления
• Примеры треков
• Советы по генерации

*Что я умею:*
• 🎼 Генерация треков по описанию
• 📤 Отправка готовых треков в чат
• 👥 Делиться с друзьями и в историю
• 📚 Библиотека ваших композиций
• 📁 Управление проектами
• 🔔 Мгновенные уведомления
• 🎨 Эмодзи статусы
• ⚡ Онлайн отслеживание генерации

*Быстрый старт:*
Отправьте описание: "Энергичный рок с гитарой"
Или используйте кнопки ниже\\! 👇`,

  help: `📚 *Справка по командам*

🎵 *Основные команды:*
/generate \\<описание\\> \\- Создать трек
/analyze \\- Анализ аудио \\(MIDI, аккорды, BPM\\)
/library \\- Мои треки \\(последние 5\\)
/projects \\- Мои проекты
/status \\- Статус генерации
/app \\- Открыть приложение
/channel \\- Канал @${CHANNEL_USERNAME}

🔬 *Анализ аудио:*
/analyze \\- Меню анализа аудио
• Транскрипция \\(MIDI, PDF, GP5\\)
• Распознавание аккордов
• Определение BPM и ритма
• Полный анализ

🎤 *Загрузка аудио:*
/cover \\<описание\\> \\- Создать кавер
/extend \\<описание\\> \\- Расширить трек
/audio \\- Справка по аудио
/cancel \\- Отменить загрузку

🎼 *Примеры генерации:*
• /generate мелодичный поп трек о любви
• /generate энергичный рок с гитарой
• /cover \\-\\-style\\="indie rock" мой кавер
• /extend \\-\\-instrumental продолжение

⚙️ *Параметры генерации:*
\\-\\-instrumental \\- Без вокала
\\-\\-style\\="стиль" \\- Музыкальный стиль
\\-\\-model v5 \\- Версия модели

📢 *Полезные ссылки:*
• @${NEWS_CHANNEL_USERNAME} \\- Новости и обновления
• /channel \\- Перейти на канал

💡 *Подсказка:* Чем детальнее описание, тем лучше результат\\!`,

  generationStarted:
    "🎼 *Генерация началась\\!*\n\nВаш трек создаётся\\.\\.\\. Обычно это занимает 1\\-2 минуты\\.\nВы получите уведомление, когда трек будет готов\\! 🔔",

  generationError:
    "❌ *Ошибка при генерации*\n\nЧто\\-то пошло не так\\. Попробуйте:\n• Упростить описание\n• Проверить формат команды\n• Попробовать ещё раз через минуту",

  noTracks:
    "📭 *У вас пока нет треков*\n\nНачните создавать музыку прямо сейчас\\!\nИспользуйте /generate <описание> или кнопку ниже 👇",

  noProjects: "📭 *У вас пока нет проектов*\n\nСоздайте первый проект в приложении\\!",

  trackReady:
    "🎉 *Ваш трек готов\\!*\n\n🎵 {title}\n\nСлушайте прямо в Telegram или откройте в приложении для полного функционала\\! 🎧",

  trackFailed: "😔 *Не удалось создать трек*\n\n{error}\n\nПопробуйте ещё раз или измените описание\\.",

  processingStatus: "⏳ *Статус генерации*\n\n{status}",

  // Audio upload messages
  awaitingAudio:
    "📤 *Ожидаю аудио файл*\n\nОтправьте аудио файл \\(MP3, WAV, OGG\\) или голосовое сообщение для обработки\\.\n\nДля отмены используйте /cancel",

  uploadSuccess:
    "✅ *Аудио загружено\\!*\n\nФайл успешно загружен и обрабатывается\\.\nВы получите уведомление, когда результат будет готов\\.",

  uploadError: "❌ *Ошибка загрузки*\n\nНе удалось загрузить аудио\\. Проверьте формат файла и попробуйте снова\\.",

  cancelSuccess: "✅ *Операция отменена*\n\nВы вернулись в главное меню\\.",
};

// Cache for database config
let cachedConfig: Record<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

// Load config from database
async function loadConfigFromDatabase(): Promise<Record<string, any>> {
  try {
    const supabase = createClient(BOT_CONFIG.supabaseUrl, BOT_CONFIG.supabaseServiceKey);

    const { data, error } = await supabase.from("telegram_bot_config").select("config_key, config_value");

    if (error) {
      console.error("Error loading bot config from database:", error);
      return {};
    }

    const config: Record<string, any> = {};
    data?.forEach((item: { config_key: string; config_value: any }) => {
      try {
        config[item.config_key] =
          typeof item.config_value === "string" ? JSON.parse(item.config_value) : item.config_value;
      } catch {
        config[item.config_key] = item.config_value;
      }
    });

    return config;
  } catch (error) {
    console.error("Failed to load bot config:", error);
    return {};
  }
}

// Get config with caching
async function getConfig(): Promise<Record<string, any>> {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  cachedConfig = await loadConfigFromDatabase();
  cacheTimestamp = now;
  return cachedConfig;
}

// Dynamic MESSAGES object that merges database config with defaults
export const MESSAGES = {
  get welcome() {
    return DEFAULT_MESSAGES.welcome;
  },
  get help() {
    return DEFAULT_MESSAGES.help;
  },
  get generationStarted() {
    return DEFAULT_MESSAGES.generationStarted;
  },
  get generationError() {
    return DEFAULT_MESSAGES.generationError;
  },
  get noTracks() {
    return DEFAULT_MESSAGES.noTracks;
  },
  get noProjects() {
    return DEFAULT_MESSAGES.noProjects;
  },
  get awaitingAudio() {
    return DEFAULT_MESSAGES.awaitingAudio;
  },
  get uploadSuccess() {
    return DEFAULT_MESSAGES.uploadSuccess;
  },
  get uploadError() {
    return DEFAULT_MESSAGES.uploadError;
  },
  get cancelSuccess() {
    return DEFAULT_MESSAGES.cancelSuccess;
  },

  trackReady: (title: string) => {
    return DEFAULT_MESSAGES.trackReady.replace("{title}", escapeMarkdown(title));
  },

  trackFailed: (error?: string) => {
    return DEFAULT_MESSAGES.trackFailed.replace("{error}", escapeMarkdown(error || "Произошла ошибка при генерации"));
  },

  processingStatus: (count: number) => {
    const status =
      count > 0 ? `Активных задач: ${count}\nВаши треки создаются\\.\\.\\.` : "Нет активных задач генерации";
    return DEFAULT_MESSAGES.processingStatus.replace("{status}", status);
  },
};

// Async version for getting messages from database
export async function getMessagesAsync() {
  const dbConfig = await getConfig();

  return {
    welcome: dbConfig.welcome_message || DEFAULT_MESSAGES.welcome,
    help: dbConfig.help_message || DEFAULT_MESSAGES.help,
    generationStarted: dbConfig.generation_started_message || DEFAULT_MESSAGES.generationStarted,
    generationError: dbConfig.generation_error_message || DEFAULT_MESSAGES.generationError,
    noTracks: dbConfig.no_tracks_message || DEFAULT_MESSAGES.noTracks,
    noProjects: dbConfig.no_projects_message || DEFAULT_MESSAGES.noProjects,
    awaitingAudio: dbConfig.awaiting_audio_message || DEFAULT_MESSAGES.awaitingAudio,
    uploadSuccess: dbConfig.upload_success_message || DEFAULT_MESSAGES.uploadSuccess,
    uploadError: dbConfig.upload_error_message || DEFAULT_MESSAGES.uploadError,
    cancelSuccess: dbConfig.cancel_success_message || DEFAULT_MESSAGES.cancelSuccess,

    trackReady: (title: string) => {
      const template = dbConfig.track_ready_message || DEFAULT_MESSAGES.trackReady;
      return template.replace("{title}", escapeMarkdown(title));
    },

    trackFailed: (error?: string) => {
      const template = dbConfig.track_failed_message || DEFAULT_MESSAGES.trackFailed;
      return template.replace("{error}", escapeMarkdown(error || "Произошла ошибка при генерации"));
    },

    processingStatus: (count: number) => {
      const template = dbConfig.processing_status_message || DEFAULT_MESSAGES.processingStatus;
      const status =
        count > 0 ? `Активных задач: ${count}\nВаши треки создаются\\.\\.\\.` : "Нет активных задач генерации";
      return template.replace("{status}", status);
    },
  };
}

// Get bot settings (notifications, rate limiting, etc.)
export async function getBotSettings() {
  const dbConfig = await getConfig();

  return {
    notificationsEnabled: dbConfig.notifications_enabled !== false,
    errorNotificationsEnabled: dbConfig.error_notifications_enabled !== false,
    systemNotificationsEnabled: dbConfig.system_notifications_enabled !== false,
    rateLimitingEnabled: dbConfig.rate_limiting_enabled !== false,
    commands: dbConfig.commands || [],
  };
}

// Helper function to escape MarkdownV2 special characters
// Security fix: Escape backslashes first to prevent incomplete sanitization
function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1"); // Then escape other special chars
}

// Invalidate cache (call after config update)
export function invalidateConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
