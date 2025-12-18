/**
 * Enhanced Deep Links Handler
 * Handles all deep link types with rich previews and analytics
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendMessage, sendPhoto, sendAudio } from '../telegram-api.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { buildMessage, createProgressBar } from '../utils/message-formatter.ts';
import { BOT_CONFIG } from '../config.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { getMenuImage } from '../keyboards/menu-images.ts';
import { logger } from '../utils/index.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

// Deep link type definitions
export type DeepLinkType = 
  | 'track' | 'project' | 'artist' | 'playlist' | 'album' | 'blog'
  | 'generate' | 'quick' | 'studio' | 'remix' | 'lyrics' | 'stats'
  | 'profile' | 'user' | 'invite' | 'ref'
  | 'buy' | 'credits' | 'subscribe'
  | 'leaderboard' | 'achievements' | 'analyze' | 'recognize'
  | 'onboarding' | 'help' | 'settings';

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
    [/^track_(.+)$/, 'track'],
    [/^project_(.+)$/, 'project'],
    [/^artist_(.+)$/, 'artist'],
    [/^playlist_(.+)$/, 'playlist'],
    [/^album_(.+)$/, 'album'],
    [/^blog_(.+)$/, 'blog'],
    [/^generate_(.+)$/, 'generate'],
    [/^quick_(.+)$/, 'quick'],
    [/^studio_(.+)$/, 'studio'],
    [/^remix_(.+)$/, 'remix'],
    [/^lyrics_(.+)$/, 'lyrics'],
    [/^stats_(.+)$/, 'stats'],
    [/^profile_(.+)$/, 'profile'],
    [/^user_(.+)$/, 'user'],
    [/^invite_(.+)$/, 'invite'],
    [/^ref_(.+)$/, 'ref'],
  ];

  // Simple matches without value
  const simpleMatches: Record<string, DeepLinkType> = {
    'buy': 'buy',
    'credits': 'credits',
    'subscribe': 'subscribe',
    'leaderboard': 'leaderboard',
    'achievements': 'achievements',
    'analyze': 'analyze',
    'recognize': 'recognize',
    'shazam': 'recognize',
    'onboarding': 'onboarding',
    'help': 'help',
    'settings': 'settings',
  };

  // Check simple matches first
  if (simpleMatches[startParam]) {
    return { type: simpleMatches[startParam], value: '' };
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
  converted: boolean = false
): Promise<void> {
  try {
    await supabase.from('deeplink_analytics').insert({
      deeplink_type: type,
      deeplink_value: value,
      telegram_user_id: userId,
      source: 'telegram_bot',
      converted,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    logger.error('Failed to track deep link analytics', error);
  }
}

/**
 * Handle track deep link with rich preview
 */
async function handleTrackDeepLink(
  chatId: number,
  userId: number,
  trackId: string
): Promise<void> {
  // Fetch track details
  const { data: track } = await supabase
    .from('tracks')
    .select('id, title, style, audio_url, cover_url, duration_seconds, likes_count, play_count, user_id')
    .eq('id', trackId)
    .single();

  if (!track) {
    await sendMessage(chatId, '❌ Трек не найден или был удалён', undefined, null);
    return;
  }

  // Get creator info
  const { data: creator } = await supabase
    .from('profiles')
    .select('username, display_name, photo_url')
    .eq('user_id', track.user_id)
    .single();

  const creatorName = creator?.display_name || creator?.username || 'Unknown';
  const duration = track.duration_seconds 
    ? `${Math.floor(track.duration_seconds / 60)}:${(track.duration_seconds % 60).toString().padStart(2, '0')}`
    : '—';

  const caption = buildMessage({
    title: track.title || 'Без названия',
    emoji: '🎵',
    description: track.style || 'AI Generated Track',
    sections: [
      {
        title: 'Информация',
        content: `👤 ${creatorName}\n⏱ ${duration} │ ❤️ ${track.likes_count || 0} │ ▶️ ${track.play_count || 0}`,
        emoji: '📊'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть трек',
      emoji: '🎵',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` }
    })
    .addRow(
      {
        text: 'В студию',
        emoji: '🎛️',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/studio/${trackId}` }
      },
      {
        text: 'Ремикс',
        emoji: '🔄',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate?remix=${trackId}` }
      }
    )
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  // Send with cover if available
  if (track.cover_url) {
    await sendPhoto(chatId, track.cover_url, { caption, replyMarkup: keyboard });
  } else {
    const menuImage = await getMenuImage('library');
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics('track', trackId, userId, true);
}

/**
 * Handle project deep link with preview
 */
async function handleProjectDeepLink(
  chatId: number,
  userId: number,
  projectId: string
): Promise<void> {
  const { data: project } = await supabase
    .from('music_projects')
    .select('id, title, description, cover_url, genre, mood, status, total_tracks_count, approved_tracks_count')
    .eq('id', projectId)
    .single();

  if (!project) {
    await sendMessage(chatId, '❌ Проект не найден', undefined, null);
    return;
  }

  const progress = project.total_tracks_count 
    ? Math.round((project.approved_tracks_count || 0) / project.total_tracks_count * 100)
    : 0;

  const caption = buildMessage({
    title: project.title,
    emoji: '📁',
    description: project.description || 'Музыкальный проект',
    sections: [
      {
        title: 'Детали',
        content: `🎵 ${project.genre || '—'} │ 🎭 ${project.mood || '—'}\n📊 ${project.approved_tracks_count || 0}/${project.total_tracks_count || 0} треков │ ${project.status}`,
        emoji: '📋'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть проект',
      emoji: '📁',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/projects/${projectId}` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  if (project.cover_url) {
    await sendPhoto(chatId, project.cover_url, { caption, replyMarkup: keyboard });
  } else {
    const menuImage = await getMenuImage('projects');
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics('project', projectId, userId, true);
}

/**
 * Handle artist deep link
 */
async function handleArtistDeepLink(
  chatId: number,
  userId: number,
  artistId: string
): Promise<void> {
  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, bio, avatar_url, genre_tags, is_ai_generated')
    .eq('id', artistId)
    .single();

  if (!artist) {
    await sendMessage(chatId, '❌ Артист не найден', undefined, null);
    return;
  }

  const caption = buildMessage({
    title: artist.name,
    emoji: artist.is_ai_generated ? '🤖' : '👤',
    description: artist.bio || 'AI Artist',
    sections: artist.genre_tags?.length ? [
      {
        title: 'Жанры',
        content: artist.genre_tags.join(', '),
        emoji: '🎵'
      }
    ] : []
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть артиста',
      emoji: '👤',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/artists/${artistId}` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  if (artist.avatar_url) {
    await sendPhoto(chatId, artist.avatar_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, 'MarkdownV2');
  }

  await trackDeepLinkAnalytics('artist', artistId, userId, true);
}

/**
 * Handle quick generation deep link
 */
async function handleQuickGenDeepLink(
  chatId: number,
  userId: number,
  style: string
): Promise<void> {
  const styleEmojis: Record<string, string> = {
    rock: '🎸', pop: '🎹', electronic: '🎧', hiphop: '🎤',
    jazz: '🎺', classical: '🎻', ambient: '🌙', lofi: '☕',
    metal: '🤘', rnb: '💜', folk: '🪕', country: '🤠'
  };

  const emoji = styleEmojis[style.toLowerCase()] || '🎵';

  const caption = buildMessage({
    title: `Быстрая генерация: ${style}`,
    emoji,
    description: 'Нажмите кнопку для мгновенной генерации трека в выбранном стиле',
    sections: [
      {
        title: 'Или настройте детали',
        content: 'Откройте генератор для точной настройки стиля, темпа и других параметров',
        emoji: '⚙️'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Генерировать сейчас',
      emoji: '🚀',
      action: { type: 'callback', data: `confirm_quick_gen_${style.toLowerCase()}` }
    })
    .addButton({
      text: 'Настроить детали',
      emoji: '⚙️',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate?style=${encodeURIComponent(style)}` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  await sendMessage(chatId, caption, keyboard, 'MarkdownV2');
  await trackDeepLinkAnalytics('quick', style, userId);
}

/**
 * Handle payment/credits deep link
 */
async function handlePaymentDeepLink(
  chatId: number,
  userId: number,
  type: 'buy' | 'credits' | 'subscribe'
): Promise<void> {
  const { handleBuyCommand } = await import('./payment.ts');
  await handleBuyCommand(chatId);
  await trackDeepLinkAnalytics(type, '', userId);
}

/**
 * Handle profile deep link
 */
async function handleProfileDeepLink(
  chatId: number,
  userId: number,
  profileUserId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, photo_url, bio, followers_count, following_count')
    .eq('user_id', profileUserId)
    .single();

  if (!profile) {
    await sendMessage(chatId, '❌ Профиль не найден', undefined, null);
    return;
  }

  const caption = buildMessage({
    title: profile.display_name || profile.username || 'Пользователь',
    emoji: '👤',
    description: profile.bio || '',
    sections: [
      {
        title: 'Статистика',
        content: `👥 ${profile.followers_count || 0} подписчиков │ ${profile.following_count || 0} подписок`,
        emoji: '📊'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть профиль',
      emoji: '👤',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/profile/${profileUserId}` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  if (profile.photo_url) {
    await sendPhoto(chatId, profile.photo_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, 'MarkdownV2');
  }

  await trackDeepLinkAnalytics('profile', profileUserId, userId, true);
}

/**
 * Handle referral/invite deep link
 */
async function handleInviteDeepLink(
  chatId: number,
  userId: number,
  inviteCode: string
): Promise<void> {
  // Process referral
  const { data: referrer } = await supabase
    .from('profiles')
    .select('user_id, username, display_name')
    .eq('user_id', inviteCode)
    .single();

  const referrerName = referrer?.display_name || referrer?.username || 'друга';

  const caption = buildMessage({
    title: 'Добро пожаловать в MusicVerse!',
    emoji: '🎉',
    description: `Вас пригласил ${referrerName}`,
    sections: [
      {
        title: 'Бонус за регистрацию',
        content: '🎁 +10 кредитов для генерации музыки',
        emoji: '💰'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Начать создавать музыку',
      emoji: '🎵',
      action: { type: 'webapp', url: BOT_CONFIG.miniAppUrl }
    })
    .build();

  await sendMessage(chatId, caption, keyboard, 'MarkdownV2');

  // Log referral
  await trackDeepLinkAnalytics('invite', inviteCode, userId, true);
}

/**
 * Handle leaderboard deep link
 */
async function handleLeaderboardDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть лидерборд',
      emoji: '🏆',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/leaderboard` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  await sendMessage(
    chatId,
    '🏆 *Лидерборд MusicVerse*\n\nСоревнуйтесь с другими музыкантами\\!',
    keyboard,
    'MarkdownV2'
  );

  await trackDeepLinkAnalytics('leaderboard', '', userId);
}

/**
 * Handle achievements deep link
 */
async function handleAchievementsDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Мои достижения',
      emoji: '🏅',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/achievements` }
    })
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  await sendMessage(
    chatId,
    '🏅 *Достижения*\n\nОткройте все достижения и получите награды\\!',
    keyboard,
    'MarkdownV2'
  );

  await trackDeepLinkAnalytics('achievements', '', userId);
}

/**
 * Handle analyze/recognize deep link
 */
async function handleAnalyzeDeepLink(chatId: number, userId: number): Promise<void> {
  const { handleAnalyzeCommand } = await import('../commands/analyze.ts');
  await handleAnalyzeCommand(chatId, userId, '');
  await trackDeepLinkAnalytics('analyze', '', userId);
}

/**
 * Main deep link handler
 */
export async function handleDeepLink(
  chatId: number,
  userId: number,
  startParam: string
): Promise<DeepLinkResult> {
  const { type, value } = parseDeepLink(startParam);

  if (!type) {
    return { handled: false };
  }

  logger.info('Processing deep link', { type, value, userId });

  try {
    switch (type) {
      case 'track':
        await handleTrackDeepLink(chatId, userId, value);
        break;
      case 'project':
        await handleProjectDeepLink(chatId, userId, value);
        break;
      case 'artist':
        await handleArtistDeepLink(chatId, userId, value);
        break;
      case 'generate':
      case 'quick':
        await handleQuickGenDeepLink(chatId, userId, value);
        break;
      case 'buy':
      case 'credits':
      case 'subscribe':
        await handlePaymentDeepLink(chatId, userId, type);
        break;
      case 'profile':
      case 'user':
        await handleProfileDeepLink(chatId, userId, value);
        break;
      case 'invite':
      case 'ref':
        await handleInviteDeepLink(chatId, userId, value);
        break;
      case 'leaderboard':
        await handleLeaderboardDeepLink(chatId, userId);
        break;
      case 'achievements':
        await handleAchievementsDeepLink(chatId, userId);
        break;
      case 'analyze':
      case 'recognize':
        await handleAnalyzeDeepLink(chatId, userId);
        break;
      case 'studio':
        // Redirect to studio
        const keyboard = new ButtonBuilder()
          .addButton({
            text: 'Открыть студию',
            emoji: '🎛️',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/studio/${value}` }
          })
          .build();
        await sendMessage(chatId, '🎛️ Открываем студию\\.\\.\\.', keyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('studio', value, userId);
        break;
      case 'remix':
        const remixKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Создать ремикс',
            emoji: '🔄',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate?remix=${value}` }
          })
          .build();
        await sendMessage(chatId, '🔄 Создаём ремикс\\.\\.\\.', remixKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('remix', value, userId);
        break;
      case 'lyrics':
        const lyricsKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Смотреть текст',
            emoji: '📝',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=lyrics_${value}` }
          })
          .build();
        await sendMessage(chatId, '📝 Открываем текст песни\\.\\.\\.', lyricsKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('lyrics', value, userId);
        break;
      case 'stats':
        const statsKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Смотреть статистику',
            emoji: '📊',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=stats_${value}` }
          })
          .build();
        await sendMessage(chatId, '📊 Открываем статистику\\.\\.\\.', statsKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('stats', value, userId);
        break;
      case 'blog':
        const blogKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Читать статью',
            emoji: '📖',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/blog/${value}` }
          })
          .build();
        await sendMessage(chatId, '📖 Открываем статью\\.\\.\\.', blogKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('blog', value, userId);
        break;
      case 'playlist':
        const playlistKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Открыть плейлист',
            emoji: '📀',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/playlists/${value}` }
          })
          .build();
        await sendMessage(chatId, '📀 Открываем плейлист\\.\\.\\.', playlistKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('playlist', value, userId);
        break;
      case 'album':
        const albumKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Открыть альбом',
            emoji: '💿',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/album/${value}` }
          })
          .build();
        await sendMessage(chatId, '💿 Открываем альбом\\.\\.\\.', albumKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('album', value, userId);
        break;
      case 'onboarding':
        const { startOnboarding } = await import('./onboarding.ts');
        await startOnboarding(chatId, userId);
        await trackDeepLinkAnalytics('onboarding', '', userId);
        break;
      case 'help':
        const { handleHelp } = await import('../commands/help.ts');
        await handleHelp(chatId);
        await trackDeepLinkAnalytics('help', '', userId);
        break;
      case 'settings':
        const settingsKeyboard = new ButtonBuilder()
          .addButton({
            text: 'Открыть настройки',
            emoji: '⚙️',
            action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/settings` }
          })
          .build();
        await sendMessage(chatId, '⚙️ Открываем настройки\\.\\.\\.', settingsKeyboard, 'MarkdownV2');
        await trackDeepLinkAnalytics('settings', '', userId);
        break;
      default:
        return { handled: false };
    }

    return { handled: true, type, entityId: value };
  } catch (error) {
    logger.error('Error handling deep link', { error, type, value });
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
