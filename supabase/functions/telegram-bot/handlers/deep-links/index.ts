/**
 * Deep links router.
 * Complex handlers extracted to modules; simple one-off cases stay inline.
 */
import { sendMessage } from "../telegram-api.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { buildMessage } from "../utils/message-formatter.ts";
import { BOT_CONFIG, NEWS_CHANNEL_URL, SUPPORT_URL } from "../config.ts";
import { getMenuImage } from "../keyboards/menu-images.ts";
import { logger } from "../utils/index.ts";
import { parseDeepLink, type DeepLinkType } from "../_shared/deeplink-parser.ts";
import { handleTrackDeepLink } from "./track.ts";
import { handleProjectDeepLink } from "./project.ts";
import { handleArtistDeepLink } from "./artist.ts";
import { handleQuickGenDeepLink } from "./quickgen.ts";
import { handlePaymentDeepLink } from "./payment.ts";
import { handleProfileDeepLink } from "./profile.ts";
import { handleInviteDeepLink } from "./invite.ts";
import { handleLeaderboardDeepLink } from "./leaderboard.ts";
import { handleAchievementsDeepLink } from "./achievements.ts";
import { handleAnalyzeDeepLink } from "./analyze.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

export interface DeepLinkResult {
  handled: boolean;
  type?: DeepLinkType;
  entityId?: string;
}

export async function handleDeepLink(chatId: number, userId: number, startParam: string): Promise<DeepLinkResult> {
  const { type, value } = parseDeepLink(startParam);

  if (!type) {
    return { handled: false };
  }

  logger.info("Processing deep link", { type, value, userId });

  try {
    switch (type) {
      case "track":
        await handleTrackDeepLink(chatId, userId, value);
        break;
      case "project":
        await handleProjectDeepLink(chatId, userId, value);
        break;
      case "artist":
        await handleArtistDeepLink(chatId, userId, value);
        break;
      case "generate":
      case "quick":
        await handleQuickGenDeepLink(chatId, userId, value);
        break;
      case "buy":
      case "credits":
      case "subscribe":
      case "subscription":
      case "pricing":
      case "tariffs":
      case "shop":
        await handlePaymentDeepLink(chatId, userId, "buy");
        break;
      case "profile":
      case "user":
        if (value) {
          await handleProfileDeepLink(chatId, userId, value);
        } else {
          const profileKeyboard = new ButtonBuilder()
            .addButton({
              text: "Открыть профиль",
              emoji: "👤",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/profile` },
            })
            .addButton({
              text: "Главное меню",
              emoji: "🏠",
              action: { type: "callback", data: "nav_main" },
            })
            .build();
          await sendMessage(chatId, "👤 *Ваш профиль*", profileKeyboard, "MarkdownV2");
        }
        break;
      case "invite":
      case "ref":
        await handleInviteDeepLink(chatId, userId, value);
        break;
      case "leaderboard":
        await handleLeaderboardDeepLink(chatId, userId);
        break;
      case "achievements":
        await handleAchievementsDeepLink(chatId, userId);
        break;
      case "analyze":
      case "recognize":
        await handleAnalyzeDeepLink(chatId, userId);
        break;
      case "studio": {
        const studioKb = new ButtonBuilder()
          .addButton({
            text: "Открыть студию",
            emoji: "🎛️",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/studio/${value}` },
          })
          .build();
        await sendMessage(chatId, "🎛️ Открываем студию\\.\\.\\.", studioKb, "MarkdownV2");
        await trackDeepLinkAnalytics("studio", value, userId);
        break;
      }
      case "remix": {
        const remixKeyboard = new ButtonBuilder()
          .addButton({
            text: "Создать ремикс",
            emoji: "🔄",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?remix=${value}` },
          })
          .build();
        await sendMessage(chatId, "🔄 Создаём ремикс\\.\\.\\.", remixKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("remix", value, userId);
        break;
      }
      case "mashup": {
        const mashupKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть Mashup",
            emoji: "🎼",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=mashup_${value}` },
          })
          .build();
        await sendMessage(chatId, "🎼 Открываем mashup\\.\\.\\.", mashupKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("mashup", value, userId);
        break;
      }
      case "lyrics": {
        const lyricsKeyboard = new ButtonBuilder()
          .addButton({
            text: "Смотреть текст",
            emoji: "📝",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=lyrics_${value}` },
          })
          .build();
        await sendMessage(chatId, "📝 Открываем текст песни\\.\\.\\.", lyricsKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("lyrics", value, userId);
        break;
      }
      case "stats": {
        const statsKeyboard = new ButtonBuilder()
          .addButton({
            text: "Смотреть статистику",
            emoji: "📊",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=stats_${value}` },
          })
          .build();
        await sendMessage(chatId, "📊 Открываем статистику\\.\\.\\.", statsKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("stats", value, userId);
        break;
      }
      case "blog": {
        const blogKeyboard = new ButtonBuilder()
          .addButton({
            text: "Читать статью",
            emoji: "📖",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/blog/${value}` },
          })
          .build();
        await sendMessage(chatId, "📖 Открываем статью\\.\\.\\.", blogKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("blog", value, userId);
        break;
      }
      case "playlist": {
        const playlistKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть плейлист",
            emoji: "📀",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/playlists/${value}` },
          })
          .build();
        await sendMessage(chatId, "📀 Открываем плейлист\\.\\.\\.", playlistKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("playlist", value, userId);
        break;
      }
      case "album": {
        const albumKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть альбом",
            emoji: "💿",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/album/${value}` },
          })
          .build();
        await sendMessage(chatId, "💿 Открываем альбом\\.\\.\\.", albumKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("album", value, userId);
        break;
      }
      case "onboarding": {
        const { handleDashboard } = await import("../dashboard.ts");
        await handleDashboard(chatId, userId);
        await trackDeepLinkAnalytics("onboarding", "", userId);
        break;
      }
      case "help": {
        const { handleHelp } = await import("../commands/help.ts");
        await handleHelp(chatId);
        await trackDeepLinkAnalytics("help", "", userId);
        break;
      }
      case "settings": {
        const settingsKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть настройки",
            emoji: "⚙️",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/settings` },
          })
          .build();
        await sendMessage(chatId, "⚙️ Открываем настройки\\.\\.\\.", settingsKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("settings", "", userId);
        break;
      }
      case "feedback": {
        const feedbackKeyboard = new ButtonBuilder()
          .addButton({
            text: "Написать отзыв",
            emoji: "💬",
            action: { type: "callback", data: "feedback_start" },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "💬 *Обратная связь*\n\nРасскажите нам о вашем опыте использования MusicVerse\\!",
          feedbackKeyboard,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("feedback", "", userId);
        break;
      }
      case "library": {
        const { handleLibrary } = await import("../commands/library.ts");
        await handleLibrary(chatId, userId);
        await trackDeepLinkAnalytics("library", "", userId);
        break;
      }
      case "projects_list": {
        const { handleProjects } = await import("../commands/projects.ts");
        await handleProjects(chatId, userId);
        await trackDeepLinkAnalytics("projects_list", "", userId);
        break;
      }
      case "artists_list": {
        const artistsKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть AI Артисты",
            emoji: "🎤",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects?tab=artists` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "🎤 *AI Артисты*\n\nОткройте список ваших AI артистов",
          artistsKeyboard,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("artists_list", "", userId);
        break;
      }
      case "playlists_list": {
        const playlistsListKb = new ButtonBuilder()
          .addButton({
            text: "Мои плейлисты",
            emoji: "📀",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/library?tab=playlists` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(chatId, "📀 *Плейлисты*\n\nВаши музыкальные коллекции", playlistsListKb, "MarkdownV2");
        await trackDeepLinkAnalytics("playlists_list", "", userId);
        break;
      }
      case "content_hub": {
        const contentHubKb = new ButtonBuilder()
          .addButton({
            text: "Открыть Content Hub",
            emoji: "📂",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects` },
          })
          .addRow(
            { text: "Проекты", emoji: "📁", action: { type: "callback", data: "nav_projects" } },
            {
              text: "Артисты",
              emoji: "🎤",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects?tab=artists` },
            },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "📂 *Content Hub*\n\nУправляйте проектами, артистами и текстами",
          contentHubKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("content_hub", "", userId);
        break;
      }
      case "cloud": {
        const cloudKb = new ButtonBuilder()
          .addButton({
            text: "Открыть облако",
            emoji: "☁️",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects?tab=cloud` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(chatId, "☁️ *Облачное хранилище*\n\nВаши аудио и референсы", cloudKb, "MarkdownV2");
        await trackDeepLinkAnalytics("cloud", "", userId);
        break;
      }
      case "templates": {
        const templatesKb = new ButtonBuilder()
          .addButton({
            text: "Открыть шаблоны",
            emoji: "📝",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/projects?tab=lyrics` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "📝 *Шаблоны текстов*\n\nВаши сохранённые тексты и шаблоны",
          templatesKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("templates", "", userId);
        break;
      }
      case "analytics": {
        const analyticsKb = new ButtonBuilder()
          .addButton({
            text: "Моя статистика",
            emoji: "📊",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/profile?tab=stats` },
          })
          .addRow(
            { text: "Лидерборд", emoji: "🏆", action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/leaderboard` } },
            {
              text: "Достижения",
              emoji: "🏅",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/achievements` },
            },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "📊 *Аналитика*\n\nОтслеживайте свой прогресс и достижения",
          analyticsKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("analytics", "", userId);
        break;
      }
      case "rewards": {
        const rewardsKb = new ButtonBuilder()
          .addButton({
            text: "Ежедневный бонус",
            emoji: "🎁",
            action: { type: "callback", data: "checkin_daily" },
          })
          .addRow(
            {
              text: "Достижения",
              emoji: "🏅",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/achievements` },
            },
            { text: "Реферальная программа", emoji: "👥", action: { type: "callback", data: "nav_referral" } },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(chatId, "🎁 *Награды*\n\nПолучайте бонусы за активность", rewardsKb, "MarkdownV2");
        await trackDeepLinkAnalytics("rewards", "", userId);
        break;
      }
      case "community": {
        const communityKb = new ButtonBuilder()
          .addButton({
            text: "Лента треков",
            emoji: "🌐",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/` },
          })
          .addRow(
            { text: "Лидерборд", emoji: "🏆", action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/leaderboard` } },
            { text: "Поиск", emoji: "🔍", action: { type: "callback", data: "search_inline" } },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "🌐 *Сообщество*\n\nОткрывайте музыку других пользователей",
          communityKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("community", "", userId);
        break;
      }
      case "creative":
      case "musiclab": {
        const musicLabKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть Music Lab",
            emoji: "🎹",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/music-lab` },
          })
          .addRow(
            { text: "Drums", emoji: "🥁", action: { type: "callback", data: "deeplink_drums" } },
            { text: "DJ", emoji: "🎧", action: { type: "callback", data: "deeplink_dj" } },
            { text: "Guitar", emoji: "🎸", action: { type: "callback", data: "deeplink_guitar" } },
          )
          .build();
        await sendMessage(chatId, "🎹 *Music Lab*\n\nВыберите инструмент:", musicLabKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("musiclab", "", userId);
        break;
      }
      case "drums": {
        const drumsKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть Drum Machine",
            emoji: "🥁",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/music-lab?tab=drums` },
          })
          .build();
        await sendMessage(chatId, "🥁 Открываем Drum Machine\\.\\.\\.", drumsKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("drums", "", userId);
        break;
      }
      case "dj": {
        const djKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть PromptDJ",
            emoji: "🎧",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/music-lab?tab=dj` },
          })
          .build();
        await sendMessage(chatId, "🎧 Открываем PromptDJ\\.\\.\\.", djKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("dj", "", userId);
        break;
      }
      case "guitar": {
        const guitarKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть Guitar Detector",
            emoji: "🎸",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/music-lab?tab=guitar` },
          })
          .build();
        await sendMessage(chatId, "🎸 Открываем детектор аккордов\\.\\.\\.", guitarKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("guitar", "", userId);
        break;
      }
      case "melody": {
        const melodyKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть Melody Mixer",
            emoji: "🎼",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/music-lab?tab=melody` },
          })
          .build();
        await sendMessage(chatId, "🎼 Открываем Melody Mixer\\.\\.\\.", melodyKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("melody", "", userId);
        break;
      }
      case "reference": {
        const referenceKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть аудио",
            emoji: "🎵",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/reference/${value}` },
          })
          .addRow(
            {
              text: "Создать кавер",
              emoji: "🎤",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?mode=cover&ref=${value}` },
            },
            {
              text: "Расширить",
              emoji: "➕",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?mode=extend&ref=${value}` },
            },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "🎵 *Загруженное аудио*\n\nОткройте в приложении для просмотра деталей и действий",
          referenceKeyboard,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("reference", value, userId);
        break;
      }
      case "share": {
        const shareKeyboard = new ButtonBuilder()
          .addButton({
            text: "Открыть трек",
            emoji: "🎵",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${value}` },
          })
          .build();
        await sendMessage(chatId, "🔗 Открываем по ссылке\\.\\.\\.", shareKeyboard, "MarkdownV2");
        await trackDeepLinkAnalytics("share", value, userId);
        break;
      }
      case "tutorials": {
        const tutorialsMessage = buildMessage({
          title: "Обучающие материалы",
          emoji: "📚",
          description: "Изучите все возможности MusicVerse AI",
          sections: [
            {
              title: "Быстрый старт",
              content: "Создайте первый трек за 5 минут",
              emoji: "🚀",
            },
            {
              title: "Продвинутые техники",
              content: "Мастер-классы по созданию музыки",
              emoji: "🎓",
            },
          ],
        });
        const tutorialsKb = new ButtonBuilder()
          .addButton({
            text: "Быстрый старт",
            emoji: "🚀",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=quickstart` },
          })
          .addRow(
            {
              text: "Генерация",
              emoji: "🎵",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=generation` },
            },
            {
              text: "Анализ",
              emoji: "🔬",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=analysis` },
            },
          )
          .addRow(
            {
              text: "Проекты",
              emoji: "📁",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=projects` },
            },
            {
              text: "Стемы",
              emoji: "🎛️",
              action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=stems` },
            },
          )
          .addButton({
            text: "Читать блог",
            emoji: "📝",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/blog` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendPhoto(chatId, getMenuImage("help"), {
          caption: tutorialsMessage,
          replyMarkup: tutorialsKb,
        });
        await trackDeepLinkAnalytics("tutorials", "", userId);
        break;
      }
      case "getting_started": {
        const gettingStartedKb = new ButtonBuilder()
          .addButton({
            text: "Начать обучение",
            emoji: "🎓",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=quickstart` },
          })
          .addButton({
            text: "Создать первый трек",
            emoji: "🎵",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "🚀 *Добро пожаловать\\!*\n\nДавайте начнём знакомство с MusicVerse AI\\. Следуйте простым шагам и создайте свой первый трек\\!",
          gettingStartedKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("getting_started", "", userId);
        break;
      }
      case "guide": {
        const guideKb = new ButtonBuilder()
          .addButton({
            text: "Открыть справку",
            emoji: "📖",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help` },
          })
          .addRow(
            { text: "Команды бота", emoji: "🤖", action: { type: "callback", data: "nav_help" } },
            { text: "FAQ", emoji: "❓", action: { type: "callback", data: "deeplink_faq" } },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "📖 *Руководство пользователя*\n\nПолная документация по всем функциям приложения",
          guideKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("guide", "", userId);
        break;
      }
      case "faq": {
        const faqMessage = buildMessage({
          title: "Часто задаваемые вопросы",
          emoji: "❓",
          sections: [
            {
              title: "Сколько стоит генерация?",
              content: "1 трек = 10 кредитов. Новым пользователям — 50 кредитов бесплатно!",
              emoji: "💰",
            },
            {
              title: "Какие форматы поддерживаются?",
              content: "MP3, WAV, OGG для загрузки. Скачивание в MP3.",
              emoji: "📁",
            },
            {
              title: "Как создать кавер?",
              content: "Загрузите аудио и используйте режим Cover.",
              emoji: "🎤",
            },
          ],
        });
        const faqKb = new ButtonBuilder()
          .addButton({
            text: "Полный FAQ",
            emoji: "📋",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/help?section=faq` },
          })
          .addButton({
            text: "Написать в поддержку",
            emoji: "💬",
            action: { type: "url", url: SUPPORT_URL },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(chatId, faqMessage, faqKb, "MarkdownV2");
        await trackDeepLinkAnalytics("faq", "", userId);
        break;
      }
      case "tips": {
        const tipsMessage = buildMessage({
          title: "Советы по генерации",
          emoji: "💡",
          sections: [
            {
              title: "Детальное описание",
              content: "Чем подробнее промпт, тем лучше результат",
              emoji: "📝",
            },
            {
              title: "Указывайте жанр",
              content: "pop, rock, electronic, jazz, hip-hop...",
              emoji: "🎸",
            },
            {
              title: "Добавляйте настроение",
              content: "energetic, melancholic, uplifting, dark...",
              emoji: "🌈",
            },
            {
              title: "Используйте референсы",
              content: "Загрузите похожий трек для лучшего результата",
              emoji: "🎵",
            },
          ],
        });
        const tipsKb = new ButtonBuilder()
          .addButton({
            text: "Попробовать генератор",
            emoji: "🎵",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate` },
          })
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(chatId, tipsMessage, tipsKb, "MarkdownV2");
        await trackDeepLinkAnalytics("tips", "", userId);
        break;
      }
      default:
        return { handled: false };
    }

    return { handled: true, type, entityId: value };
  } catch (error) {
    logger.error("Error handling deep link", { error, type, value });
    return { handled: false };
  }
}

/**
 * Generate deep link URL for sharing
 */
export function generateDeepLink(type: DeepLinkType, value?: string): string {
  const param = value ? `${type}_${value}` : type;
  return `https://t.me/${BOT_CONFIG.botUsername}?start=${param}`;
}

/**
 * Generate Mini App deep link
 */
export function generateAppDeepLink(type: DeepLinkType, value?: string): string {
  const param = value ? `${type}_${value}` : type;
  return `https://t.me/${BOT_CONFIG.botUsername}/app?startapp=${param}`;
}
