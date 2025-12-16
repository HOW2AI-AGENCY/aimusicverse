import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown } from '../utils/index.ts';
import {
  parseInlineQuery,
  buildSearchQuery,
  getCategoryName,
  getCategoryEmoji,
  InlineCategory,
  type TrackSearchResult,
  type InlineQueryContext,
} from './inline-types.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

interface InlineQuery {
  id: string;
  from: { id: number; first_name: string; username?: string };
  query: string;
  offset: string;
}

interface InlineQueryResult {
  type: string;
  id: string;
  audio_url?: string;
  title: string;
  performer?: string;
  audio_duration?: number;
  caption?: string;
  parse_mode?: string;
  thumbnail_url?: string;
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; url?: string }>> };
}

/**
 * Enhanced Inline Query Handler
 * Supports 8 categories: my, public, trending, new, featured, genre, mood, popular
 */
export async function handleInlineQuery(inlineQuery: InlineQuery) {
  const { id, query, from, offset } = inlineQuery;
  
  logger.info('inline_query_enhanced', { 
    userId: from.id, 
    query,
    offset 
  });

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username, display_name')
      .eq('telegram_id', from.id)
      .single();

    // For guests, show button to login and some public content
    if (!profile) {
      const publicResults = await getPublicTracksForGuests();
      await answerInlineQuery(id, publicResults, { 
        button: { 
          text: '🔑 Войти для полного доступа', 
          web_app: { url: BOT_CONFIG.miniAppUrl } 
        } 
      });
      return;
    }

    // Parse query to extract category and filters
    const parsed = parseInlineQuery(query);
    const offsetNum = parseInt(offset) || 0;

    // Build context
    const context: InlineQueryContext = {
      query: parsed.searchQuery,
      offset: offsetNum,
      category: parsed.category,
      filter: parsed.filter,
      userId: profile.user_id,
      telegramUserId: from.id,
    };

    // Execute search based on category
    const tracks = await executeSearch(context);
    
    // Log search for analytics
    await logInlineSearch(context, tracks.length);

    // Convert to inline results
    const results = tracks.map(track => 
      createTrackResult(track, profile.username, context.category)
    );

    // Determine if there are more results
    const pageSize = 20;
    const hasMore = results.length === pageSize;
    const nextOffset = hasMore ? String(offsetNum + pageSize) : '';

    // Build switch button for category switching
    const switchButton = getCategorySwitchButton(parsed.category, query);

    // Answer inline query
    await answerInlineQuery(id, results, {
      cache_time: getCacheTime(parsed.category),
      is_personal: parsed.category === InlineCategory.MY,
      next_offset: nextOffset,
      button: switchButton,
    });

    logger.info('inline_query_success', { 
      userId: from.id,
      category: parsed.category,
      resultsCount: results.length,
      hasMore 
    });

  } catch (error) {
    logger.error('inline_query_error', error);
    
    // Return empty results with error hint
    await answerInlineQuery(id, [], {
      cache_time: 10,
      button: {
        text: '⚠️ Ошибка поиска - попробуйте снова',
        start_parameter: 'inline_error',
      }
    });
  }
}

/**
 * Execute search query based on category and context
 */
async function executeSearch(context: InlineQueryContext): Promise<TrackSearchResult[]> {
  const query = buildSearchQuery(supabase, context);
  
  try {
    const { data, error } = await query;
    
    if (error) {
      logger.error('search_query_error', { error, context });
      return [];
    }

    // Transform data to consistent format
    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      style: item.style,
      tags: item.tags,
      audio_url: item.audio_url || item.telegram_file_id,
      cover_art_url: item.cover_art_url || item.cover_url,
      duration: item.duration || item.duration_seconds,
      created_at: item.created_at,
      user_id: item.user_id,
      creator_username: item.creator_username || item.username || item.profiles?.username,
      creator_name: item.creator_name || item.display_name || item.profiles?.display_name,
      computed_genre: item.computed_genre,
      computed_mood: item.computed_mood,
      trending_score: item.trending_score,
      quality_score: item.quality_score,
    }));
  } catch (error) {
    logger.error('execute_search_error', { error, context });
    return [];
  }
}

/**
 * Get public tracks for guest users (not logged in)
 */
async function getPublicTracksForGuests(): Promise<InlineQueryResult[]> {
  try {
    const { data: tracks } = await supabase
      .from('tracks')
      .select('*, profiles!inner(username, display_name)')
      .eq('is_public', true)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!tracks) return [];

    return tracks.map(track => createTrackResult(
      track as TrackSearchResult,
      track.profiles?.username,
      InlineCategory.PUBLIC
    ));
  } catch (error) {
    logger.error('get_public_tracks_error', error);
    return [];
  }
}

/**
 * Create inline result for a track
 */
function createTrackResult(
  track: TrackSearchResult,
  username?: string,
  category?: InlineCategory
): InlineQueryResult {
  const deepLink = `${BOT_CONFIG.deepLinkBase}?startapp=track_${track.id}`;
  const performer = username ? `@${username}` : track.creator_username ? `@${track.creator_username}` : '@AIMusicVerseBot';
  
  // Build caption with category context
  const categoryEmoji = category ? getCategoryEmoji(category) : '🎵';
  const genreTag = track.computed_genre ? `#${track.computed_genre}` : '';
  const moodTag = track.computed_mood ? `#${track.computed_mood}` : '';
  
  const escapedTitle = escapeMarkdown(track.title || 'Трек');
  const escapedPerformer = escapeMarkdown(performer);
  const escapedStyle = track.style ? escapeMarkdown(track.style) : '';
  const escapedDeepLink = escapeMarkdown(deepLink);
  
  let caption = `${categoryEmoji} *${escapedTitle}*\n👤 ${escapedPerformer}`;
  
  if (escapedStyle) {
    caption += `\n🎼 ${escapedStyle}`;
  }
  
  if (genreTag || moodTag) {
    caption += `\n${genreTag} ${moodTag}`.trim();
  }
  
  if (category === InlineCategory.TRENDING && track.trending_score) {
    caption += `\n🔥 Trending \\(score: ${Math.round(track.trending_score)}\\)`;
  }
  
  caption += `\n🔗 ${escapedDeepLink}`;

  return {
    type: 'audio',
    id: track.id,
    audio_url: track.audio_url,
    title: track.title || 'MusicVerse Track',
    performer,
    audio_duration: track.duration ? Math.round(track.duration) : undefined,
    caption,
    parse_mode: 'MarkdownV2',
    thumbnail_url: track.cover_art_url || undefined,
    reply_markup: {
      inline_keyboard: [[
        { text: '🎵 Открыть в приложении', url: deepLink }
      ]]
    }
  };
}

/**
 * Get category switch button for inline query
 */
function getCategorySwitchButton(currentCategory: InlineCategory, query: string): any {
  // Suggest related categories based on current one
  const suggestions: Record<InlineCategory, { text: string; query: string }> = {
    [InlineCategory.MY]: { text: '🌐 Искать в публичных', query: 'public:' },
    [InlineCategory.PUBLIC]: { text: '🔥 Показать тренды', query: 'trending:' },
    [InlineCategory.TRENDING]: { text: '⭐ Показать новое', query: 'new:' },
    [InlineCategory.NEW]: { text: '✨ Показать избранное', query: 'featured:' },
    [InlineCategory.FEATURED]: { text: '🎸 Поиск по жанрам', query: 'genre:' },
    [InlineCategory.GENRE]: { text: '💭 Поиск по настроению', query: 'mood:' },
    [InlineCategory.MOOD]: { text: '🎵 Мои треки', query: 'my:' },
    [InlineCategory.POPULAR]: { text: '🌐 Все публичные', query: 'public:' },
  };

  const suggestion = suggestions[currentCategory];
  
  if (suggestion) {
    return {
      text: suggestion.text,
      switch_inline_query_current_chat: suggestion.query,
    };
  }

  return undefined;
}

/**
 * Get cache time based on category
 */
function getCacheTime(category: InlineCategory): number {
  const cacheTimes: Record<InlineCategory, number> = {
    [InlineCategory.MY]: 30,       // 30 seconds for personal
    [InlineCategory.PUBLIC]: 120,   // 2 minutes for public
    [InlineCategory.TRENDING]: 300, // 5 minutes for trending
    [InlineCategory.NEW]: 60,       // 1 minute for new
    [InlineCategory.FEATURED]: 300, // 5 minutes for featured
    [InlineCategory.GENRE]: 180,    // 3 minutes for genre
    [InlineCategory.MOOD]: 180,     // 3 minutes for mood
    [InlineCategory.POPULAR]: 300,  // 5 minutes for popular
  };
  
  return cacheTimes[category] || 60;
}

/**
 * Log inline search for analytics
 */
async function logInlineSearch(context: InlineQueryContext, resultsCount: number): Promise<void> {
  try {
    await supabase
      .from('inline_search_history')
      .insert({
        user_id: context.userId,
        telegram_user_id: context.telegramUserId,
        query: context.query,
        category: context.category,
        results_count: resultsCount,
      });
  } catch (error) {
    // Non-critical, just log
    logger.error('log_inline_search_error', error);
  }
}

/**
 * Answer inline query via Telegram API
 */
async function answerInlineQuery(
  id: string, 
  results: InlineQueryResult[], 
  options?: any
): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    logger.error('missing_bot_token', { context: 'answerInlineQuery' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/answerInlineQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inline_query_id: id,
          results,
          cache_time: 60,
          is_personal: true,
          ...options,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('answer_inline_query_failed', { status: response.status, error });
    }
  } catch (error) {
    logger.error('answer_inline_query_error', error);
  }
}
