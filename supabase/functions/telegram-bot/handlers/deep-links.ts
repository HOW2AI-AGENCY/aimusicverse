/**
 * Enhanced Deep Links Handler
 * Handles all deep link types with rich previews and analytics
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, sendPhoto, sendAudio } from "../telegram-api.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { buildMessage, createProgressBar } from "../utils/message-formatter.ts";
import { BOT_CONFIG, SUPPORT_URL, NEWS_CHANNEL_URL } from "../config.ts";
import { trackMessage } from "../utils/message-manager.ts";
import { getMenuImage } from "../keyboards/menu-images.ts";
import { logger } from "../utils/index.ts";

const supabase = getSupabaseClient();

// Deep link type definitions
export type DeepLinkType =
  | "track"
  | "project"
  | "artist"
  | "playlist"
  | "album"
  | "blog"
  | "generate"
  | "quick"
  | "studio"
  | "remix"
  | "lyrics"
  | "stats"
  | "share"
  | "profile"
  | "user"
  | "invite"
  | "ref"
  | "reference"
  | "buy"
  | "credits"
  | "subscribe"
  | "subscription"
  | "pricing"
  | "tariffs"
  | "shop"
  | "leaderboard"
  | "achievements"
  | "analyze"
  | "recognize"
  | "onboarding"
  | "help"
  | "settings"
  | "feedback"
  | "library"
  | "projects_list"
  | "artists_list"
  | "cloud"
  | "templates"
  | "creative"
  | "musiclab"
  | "drums"
  | "dj"
  | "guitar"
  | "melody"
  | "content_hub"
  | "analytics"
  | "rewards"
  | "community"
  | "playlists_list"
  | "tutorials"
  | "guide"
  | "faq"
  | "getting_started"
  | "tips";

interface DeepLinkResult {
  handled: boolean;
  type?: DeepLinkType;
  entityId?: string;
}

/**
 * Parse deep link parameter into type and value
 */
export function parseDeepLink(startParam: string): { type: DeepLinkType | null; value: string } {
  const patterns: [RegExp, DeepLinkType][] = [
    [/^track_(.+)$/, "track"],
    [/^project_(.+)$/, "project"],
    [/^artist_(.+)$/, "artist"],
    [/^playlist_(.+)$/, "playlist"],
    [/^album_(.+)$/, "album"],
    [/^blog_(.+)$/, "blog"],
    [/^generate_(.+)$/, "generate"],
    [/^quick_(.+)$/, "quick"],
    [/^studio_(.+)$/, "studio"],
    [/^remix_(.+)$/, "remix"],
    [/^lyrics_(.+)$/, "lyrics"],
    [/^stats_(.+)$/, "stats"],
    [/^profile_(.+)$/, "profile"],
    [/^user_(.+)$/, "user"],
    [/^invite_(.+)$/, "invite"],
    [/^ref_(.+)$/, "ref"],
    [/^reference_(.+)$/, "reference"],
  ];

  // Simple matches without value
  const simpleMatches: Record<string, DeepLinkType> = {
    buy: "buy",
    credits: "credits",
    subscribe: "subscribe",
    subscription: "subscription",
    pricing: "pricing",
    tariffs: "tariffs",
    shop: "shop",
    leaderboard: "leaderboard",
    achievements: "achievements",
    analyze: "analyze",
    recognize: "recognize",
    shazam: "recognize",
    onboarding: "onboarding",
    help: "help",
    settings: "settings",
    feedback: "feedback",
    library: "library",
    projects: "projects_list",
    artists: "artists_list",
    playlists: "playlists_list",
    creative: "creative",
    musiclab: "musiclab",
    drums: "drums",
    dj: "dj",
    guitar: "guitar",
    melody: "melody",
    "content-hub": "content_hub",
    cloud: "cloud",
    templates: "templates",
    analytics: "analytics",
    rewards: "rewards",
    community: "community",
    profile: "profile",
    // Tutorials and guides
    tutorials: "tutorials",
    guide: "guide",
    faq: "faq",
    "getting-started": "getting_started",
    "start-guide": "getting_started",
    tips: "tips",
    blog: "blog",
  };

  // Check simple matches first
  if (simpleMatches[startParam]) {
    return { type: simpleMatches[startParam], value: "" };
  }

  // Check pattern matches
  for (const [pattern, type] of patterns) {
    const match = startParam.match(pattern);
    if (match) {
      return { type, value: match[1] };
    }
  }

  return { type: null, value: startParam };
}

/**
 * Track deep link analytics
 */
async function trackDeepLinkAnalytics(
  type: DeepLinkType,
  value: string,
  userId: number,
  converted: boolean = false,
): Promise<void> {
  try {
    await supabase.from("deeplink_analytics").insert({
      deeplink_type: type,
      deeplink_value: value,
      telegram_user_id: userId,
      source: "telegram_bot",
      converted,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error("Failed to track deep link analytics", error);
  }
}

/**
 * Handle track deep link with rich preview
 */
async function handleTrackDeepLink(chatId: number, userId: number, trackId: string): Promise<void> {
  // Fetch track details
  const { data: track } = await supabase
    .from("tracks")
    .select("id, title, style, audio_url, cover_url, duration_seconds, likes_count, play_count, user_id")
    .eq("id", trackId)
    .single();

  if (!track) {
    await sendMessage(chatId, "❌ Трек не найден или был удалён", undefined, null);
    return;
  }

  // Get creator info
  const { data: creator } = await supabase
    .from("profiles")
    .select("username, display_name, photo_url")
    .eq("user_id", track.user_id)
    .single();

  const creatorName = creator?.display_name || creator?.username || "Unknown";
  const duration = track.duration_seconds
    ? `${Math.floor(track.duration_seconds / 60)}:${(track.duration_seconds % 60).toString().padStart(2, "0")}`
    : "—";

  const caption = buildMessage({
    title: track.title || "Без названия",
    emoji: "🎵",
    description: track.style || "AI Generated Track",
    sections: [
      {
        title: "Информация",
        content: `👤 ${creatorName}\n⏱ ${duration} │ ❤️ ${track.likes_count || 0} │ ▶️ ${track.play_count || 0}`,
        emoji: "📊",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть трек",
      emoji: "🎵",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` },
    })
    .addRow(
      {
        text: "В студию",
        emoji: "🎛️",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/studio/${trackId}` },
      },
      {
        text: "Ремикс",
        emoji: "🔄",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?remix=${trackId}` },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  // Send with cover if available
  if (track.cover_url) {
    await sendPhoto(chatId, track.cover_url, { caption, replyMarkup: keyboard });
  } else {
    const menuImage = await getMenuImage("library");
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics("track", trackId, userId, true);
}

/**
 * Handle project deep link with enhanced preview
 */
async function handleProjectDeepLink(chatId: number, userId: number, projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from("music_projects")
    .select("id, title, description, cover_url, genre, mood, status, project_type, user_id, created_at")
    .eq("id", projectId)
    .single();

  if (!project) {
    await sendMessage(chatId, "❌ Проект не найден или был удалён", undefined, null);
    return;
  }

  // Get track count and progress
  const { data: projectTracks, count: trackCount } = await supabase
    .from("project_tracks")
    .select("id, track_id", { count: "exact" })
    .eq("project_id", projectId);

  const completedTracks = projectTracks?.filter((t) => t.track_id).length || 0;
  const totalTracks = trackCount || 0;
  const progress = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;

  // Get creator info
  const { data: creator } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("user_id", project.user_id)
    .single();

  const creatorName = creator?.display_name || creator?.username || "Unknown";

  // Status and type labels
  const statusLabels: Record<string, string> = {
    draft: "📝 Черновик",
    in_progress: "🔄 В работе",
    completed: "✅ Завершён",
    released: "🚀 Выпущен",
    published: "🌐 Опубликован",
  };

  const typeLabels: Record<string, string> = {
    single: "🎵 Сингл",
    ep: "💿 EP",
    album: "📀 Альбом",
    mixtape: "🎚️ Микстейп",
  };

  const status = statusLabels[project.status || "draft"] || "📝 Черновик";
  const type = typeLabels[project.project_type || "single"] || "🎵 Сингл";

  // Build progress bar
  const progressBar = "█".repeat(Math.round(progress / 10)) + "░".repeat(10 - Math.round(progress / 10));

  const caption = buildMessage({
    title: project.title || "Проект",
    emoji: "📁",
    description: project.description || "Музыкальный проект",
    sections: [
      {
        title: "Детали",
        content: `${type} • ${status}\n👤 ${creatorName}`,
        emoji: "📋",
      },
      {
        title: "Прогресс",
        content: `${progressBar} ${progress}%\n🎵 ${completedTracks}/${totalTracks} треков готово`,
        emoji: "📊",
      },
      ...(project.genre || project.mood
        ? [
            {
              title: "Стиль",
              content: [project.genre, project.mood].filter(Boolean).join(" • "),
              emoji: "🎵",
            },
          ]
        : []),
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть проект",
      emoji: "📁",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}` },
    })
    .addRow(
      {
        text: "Треки",
        emoji: "🎵",
        action: { type: "callback", data: `project_tracks_${projectId}` },
      },
      {
        text: "Поделиться",
        emoji: "📤",
        action: { type: "callback", data: `project_share_${projectId}` },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  // Send with cover if available
  const defaultCover = "https://ygmvthybdrqymfsqifmj.supabase.co/storage/v1/object/public/bot-assets/project-cover.png";
  const coverUrl = project.cover_url || defaultCover;

  try {
    await sendPhoto(chatId, coverUrl, { caption, replyMarkup: keyboard });
  } catch (e) {
    // Fallback if cover fails
    const menuImage = await getMenuImage("projects");
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics("project", projectId, userId, true);
}

/**
 * Handle artist deep link
 */
async function handleArtistDeepLink(chatId: number, userId: number, artistId: string): Promise<void> {
  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, bio, avatar_url, genre_tags, is_ai_generated")
    .eq("id", artistId)
    .single();

  if (!artist) {
    await sendMessage(chatId, "❌ Артист не найден", undefined, null);
    return;
  }

  const caption = buildMessage({
    title: artist.name,
    emoji: artist.is_ai_generated ? "🤖" : "👤",
    description: artist.bio || "AI Artist",
    sections: artist.genre_tags?.length
      ? [
          {
            title: "Жанры",
            content: artist.genre_tags.join(", "),
            emoji: "🎵",
          },
        ]
      : [],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть артиста",
      emoji: "👤",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/artists/${artistId}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (artist.avatar_url) {
    await sendPhoto(chatId, artist.avatar_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  }

  await trackDeepLinkAnalytics("artist", artistId, userId, true);
}

/**
 * Handle quick generation deep link
 */
async function handleQuickGenDeepLink(chatId: number, userId: number, style: string): Promise<void> {
  const styleEmojis: Record<string, string> = {
    rock: "🎸",
    pop: "🎹",
    electronic: "🎧",
    hiphop: "🎤",
    jazz: "🎺",
    classical: "🎻",
    ambient: "🌙",
    lofi: "☕",
    metal: "🤘",
    rnb: "💜",
    folk: "🪕",
    country: "🤠",
  };

  const emoji = styleEmojis[style.toLowerCase()] || "🎵";

  const caption = buildMessage({
    title: `Быстрая генерация: ${style}`,
    emoji,
    description: "Нажмите кнопку для мгновенной генерации трека в выбранном стиле",
    sections: [
      {
        title: "Или настройте детали",
        content: "Откройте генератор для точной настройки стиля, темпа и других параметров",
        emoji: "⚙️",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Генерировать сейчас",
      emoji: "🚀",
      action: { type: "callback", data: `confirm_quick_gen_${style.toLowerCase()}` },
    })
    .addButton({
      text: "Настроить детали",
      emoji: "⚙️",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?style=${encodeURIComponent(style)}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics("quick", style, userId);
}

/**
 * Handle payment/credits deep link
 */
async function handlePaymentDeepLink(
  chatId: number,
  userId: number,
  type: "buy" | "credits" | "subscribe",
  productCode?: string,
): Promise<void> {
  // Build payment URL with optional product pre-selection
  let paymentUrl = `${BOT_CONFIG.miniAppUrl}/payment`;
  if (productCode) {
    paymentUrl += `?product=${encodeURIComponent(productCode)}`;
  } else if (type === "credits") {
    paymentUrl += "?select=popular";
  }

  const caption = buildMessage({
    title: "Пополнение кредитов",
    emoji: "💳",
    description: "Оплата банковской картой через защищённое соединение",
    sections: [
      {
        title: "Как работают кредиты",
        content: "3 кредита = 1 AI-трек • 1 кредит = разделение на стемы",
        emoji: "⚡",
      },
      {
        title: "Безопасность",
        content: "PCI DSS сертификация • 3D-Secure • Мгновенное зачисление",
        emoji: "🔒",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть магазин",
      emoji: "💳",
      action: { type: "webapp", url: paymentUrl },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics(type, productCode || "", userId);
}

/**
 * Handle profile deep link
 */
async function handleProfileDeepLink(chatId: number, userId: number, profileUserId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, photo_url, bio, followers_count, following_count")
    .eq("user_id", profileUserId)
    .single();

  if (!profile) {
    await sendMessage(chatId, "❌ Профиль не найден", undefined, null);
    return;
  }

  const caption = buildMessage({
    title: profile.display_name || profile.username || "Пользователь",
    emoji: "👤",
    description: profile.bio || "",
    sections: [
      {
        title: "Статистика",
        content: `👥 ${profile.followers_count || 0} подписчиков │ ${profile.following_count || 0} подписок`,
        emoji: "📊",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть профиль",
      emoji: "👤",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/profile/${profileUserId}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (profile.photo_url) {
    await sendPhoto(chatId, profile.photo_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  }

  await trackDeepLinkAnalytics("profile", profileUserId, userId, true);
}

/**
 * Handle referral/invite deep link
 */
async function handleInviteDeepLink(chatId: number, userId: number, inviteCode: string): Promise<void> {
  // Process referral
  const { data: referrer } = await supabase
    .from("profiles")
    .select("user_id, username, display_name")
    .eq("user_id", inviteCode)
    .single();

  const referrerName = referrer?.display_name || referrer?.username || "друга";

  const caption = buildMessage({
    title: "Добро пожаловать в MusicVerse!",
    emoji: "🎉",
    description: `Вас пригласил ${referrerName}`,
    sections: [
      {
        title: "Бонус за регистрацию",
        content: "🎁 +10 кредитов для генерации музыки",
        emoji: "💰",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Начать создавать музыку",
      emoji: "🎵",
      action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");

  // Log referral
  await trackDeepLinkAnalytics("invite", inviteCode, userId, true);
}

/**
 * Handle leaderboard deep link
 */
async function handleLeaderboardDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть лидерборд",
      emoji: "🏆",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/leaderboard` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(
    chatId,
    "🏆 *Лидерборд MusicVerse*\n\nСоревнуйтесь с другими музыкантами\\!",
    keyboard,
    "MarkdownV2",
  );

  await trackDeepLinkAnalytics("leaderboard", "", userId);
}

/**
 * Handle achievements deep link
 */
async function handleAchievementsDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Мои достижения",
      emoji: "🏅",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/achievements` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, "🏅 *Достижения*\n\nОткройте все достижения и получите награды\\!", keyboard, "MarkdownV2");

  await trackDeepLinkAnalytics("achievements", "", userId);
}

/**
 * Handle analyze/recognize deep link
 */
async function handleAnalyzeDeepLink(chatId: number, userId: number): Promise<void> {
  const { handleAnalyzeCommand } = await import("../commands/analyze.ts");
  await handleAnalyzeCommand(chatId, userId, "");
  await trackDeepLinkAnalytics("analyze", "", userId);
}

/**
 * Main deep link handler
 */
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
          // Own profile
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
      case "studio":
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
      case "remix":
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
      case "lyrics":
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
      case "stats":
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
      case "blog":
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
      case "playlist":
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
      case "album":
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
      case "onboarding":
        const { handleDashboard: showDashboard } = await import("./dashboard.ts");
        await showDashboard(chatId, userId);
        await trackDeepLinkAnalytics("onboarding", "", userId);
        break;
      case "help":
        const { handleHelp } = await import("../commands/help.ts");
        await handleHelp(chatId);
        await trackDeepLinkAnalytics("help", "", userId);
        break;
      case "settings":
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
      case "feedback":
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

      // Navigation shortcuts
      case "library":
        const { handleLibrary } = await import("../commands/library.ts");
        await handleLibrary(chatId, userId);
        await trackDeepLinkAnalytics("library", "", userId);
        break;
      case "projects_list":
        const { handleProjects } = await import("../commands/projects.ts");
        await handleProjects(chatId, userId);
        await trackDeepLinkAnalytics("projects_list", "", userId);
        break;
      case "artists_list":
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
      case "playlists_list":
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

      // Content Hub
      case "content_hub":
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

      // Cloud storage
      case "cloud":
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

      // Templates
      case "templates":
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

      // Analytics
      case "analytics":
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

      // Rewards
      case "rewards":
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

      // Community
      case "community":
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

      // MusicLab shortcuts
      case "creative":
      case "musiclab":
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
      case "drums":
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
      case "dj":
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
      case "guitar":
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
      case "melody":
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
      case "reference":
        // Reference audio deep link - open in app
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
      case "share":
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

      // Tutorials and guides
      case "tutorials":
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

      case "getting_started":
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

      case "guide":
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

      case "faq":
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

      case "tips":
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

      case "blog":
        const blogKb = new ButtonBuilder()
          .addButton({
            text: "Читать блог",
            emoji: "📝",
            action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/blog` },
          })
          .addRow(
            { text: "Новости", emoji: "📰", action: { type: "callback", data: "nav_news" } },
            { text: "Канал", emoji: "📢", action: { type: "url", url: NEWS_CHANNEL_URL } },
          )
          .addButton({
            text: "Главное меню",
            emoji: "🏠",
            action: { type: "callback", data: "nav_main" },
          })
          .build();
        await sendMessage(
          chatId,
          "📝 *Блог MusicVerse*\n\nСтатьи, новости и руководства по созданию музыки с AI",
          blogKb,
          "MarkdownV2",
        );
        await trackDeepLinkAnalytics("blog", "", userId);
        break;

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
