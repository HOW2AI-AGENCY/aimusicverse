/**
 * Inline Query Handler
 * Enhanced with projects, tracks, and smart search
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown } from '../utils/index.ts';
import { getProjectDeepLink, getTrackDeepLink } from '../../_shared/telegram-config.ts';

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

interface InlineQueryResultAudio {
  type: 'audio';
  id: string;
  audio_url: string;
  title: string;
  performer?: string;
  audio_duration?: number;
  caption?: string;
  parse_mode?: string;
  thumbnail_url?: string;
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; url?: string }>> };
}

interface InlineQueryResultArticle {
  type: 'article';
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  input_message_content: {
    message_text: string;
    parse_mode?: string;
  };
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; url?: string }>> };
}

type InlineQueryResult = InlineQueryResultAudio | InlineQueryResultArticle;

// Default cover for projects without cover
const DEFAULT_PROJECT_COVER = 'https://ygmvthybdrqymfsqifmj.supabase.co/storage/v1/object/public/bot-assets/project-cover.png';

export async function handleInlineQuery(inlineQuery: InlineQuery) {
  const { id, query, from, offset } = inlineQuery;
  
  logger.info('inline_query', { userId: from.id, query });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('telegram_id', from.id)
      .single();

    if (!profile) {
      await answerInlineQuery(id, [], { 
        button: { text: '🔑 Войти в MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } },
        cache_time: 10
      });
      return;
    }

    const pageSize = 20;
    const offsetNum = parseInt(offset) || 0;
    let results: InlineQueryResult[] = [];

    // Check for specific query types
    if (query.startsWith('project_')) {
      // Share specific project
      const projectId = query.replace('project_', '');
      results = await getProjectResult(projectId, profile.username);
    } else if (query.startsWith('track_')) {
      // Share specific track
      const trackId = query.replace('track_', '');
      results = await getTrackResult(trackId, profile.username);
    } else if (query.startsWith('p:') || query.toLowerCase().includes('проект')) {
      // Search projects
      const searchQuery = query.replace(/^p:/i, '').replace(/проект[ыи]?\s*/i, '').trim();
      results = await searchProjects(profile.user_id, searchQuery, offsetNum, pageSize, profile.username);
    } else {
      // Default: search tracks, with projects at the end
      results = await searchTracksAndProjects(profile.user_id, query, offsetNum, pageSize, profile.username);
    }

    // Log for analytics
    await logInlineSearch(profile.user_id, from.id, query, results.length);

    await answerInlineQuery(id, results, {
      cache_time: 30,
      is_personal: true,
      next_offset: results.length === pageSize ? String(offsetNum + pageSize) : '',
      switch_pm_text: '🎵 Создать новый трек',
      switch_pm_parameter: 'generate'
    });
  } catch (error) {
    logger.error('inline_query_error', error);
    await answerInlineQuery(id, []);
  }
}

/**
 * Get single project result for sharing
 */
async function getProjectResult(projectId: string, username?: string): Promise<InlineQueryResult[]> {
  const { data: project } = await supabase
    .from('music_projects')
    .select('id, title, description, genre, mood, status, cover_url, project_type')
    .eq('id', projectId)
    .single();

  if (!project) return [];

  // Get track count
  const { count } = await supabase
    .from('project_tracks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return [createProjectResult(project, count || 0, username)];
}

/**
 * Get single track result for sharing
 */
async function getTrackResult(trackId: string, username?: string): Promise<InlineQueryResult[]> {
  const { data: track } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .single();

  if (!track?.audio_url) return [];
  return [createTrackResult(track, username)];
}

/**
 * Search projects
 */
async function searchProjects(
  userId: string,
  query: string,
  offset: number,
  limit: number,
  username?: string
): Promise<InlineQueryResult[]> {
  let projectsQuery = supabase
    .from('music_projects')
    .select('id, title, description, genre, mood, status, cover_url, project_type')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.trim()) {
    projectsQuery = projectsQuery.or(`title.ilike.%${query}%,genre.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data: projects } = await projectsQuery;
  if (!projects?.length) return [];

  // Get track counts for all projects
  const projectIds = projects.map(p => p.id);
  const { data: trackCounts } = await supabase
    .from('project_tracks')
    .select('project_id')
    .in('project_id', projectIds);

  const countMap = new Map<string, number>();
  trackCounts?.forEach(t => {
    countMap.set(t.project_id, (countMap.get(t.project_id) || 0) + 1);
  });

  return projects.map(p => createProjectResult(p, countMap.get(p.id) || 0, username));
}

/**
 * Search tracks and include some projects
 */
async function searchTracksAndProjects(
  userId: string,
  query: string,
  offset: number,
  limit: number,
  username?: string
): Promise<InlineQueryResult[]> {
  const results: InlineQueryResult[] = [];

  // Search tracks
  let tracksQuery = supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.trim()) {
    tracksQuery = tracksQuery.or(`title.ilike.%${query}%,style.ilike.%${query}%`);
  }

  const { data: tracks } = await tracksQuery;
  if (tracks?.length) {
    results.push(...tracks.map(t => createTrackResult(t, username)));
  }

  // If first page and space available, add some recent projects
  if (offset === 0 && results.length < limit) {
    let projectsQuery = supabase
      .from('music_projects')
      .select('id, title, description, genre, mood, status, cover_url, project_type')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(Math.min(3, limit - results.length));

    if (query.trim()) {
      projectsQuery = projectsQuery.or(`title.ilike.%${query}%,genre.ilike.%${query}%`);
    }

    const { data: projects } = await projectsQuery;
    if (projects?.length) {
      // Get track counts
      const projectIds = projects.map(p => p.id);
      const { data: trackCounts } = await supabase
        .from('project_tracks')
        .select('project_id')
        .in('project_id', projectIds);

      const countMap = new Map<string, number>();
      trackCounts?.forEach(t => {
        countMap.set(t.project_id, (countMap.get(t.project_id) || 0) + 1);
      });

      results.push(...projects.map(p => createProjectResult(p, countMap.get(p.id) || 0, username)));
    }
  }

  return results;
}

/**
 * Create track inline result
 */
function createTrackResult(track: any, username?: string): InlineQueryResultAudio {
  const deepLink = getTrackDeepLink(track.id);
  const performer = username ? `@${username}` : 'MusicVerse AI';
  const escapedTitle = escapeMarkdown(track.title || 'Трек');
  const escapedPerformer = escapeMarkdown(performer);
  const escapedStyle = track.style ? `\n🎵 ${escapeMarkdown(track.style)}` : '';
  const escapedDeepLink = escapeMarkdown(deepLink);
  
  return {
    type: 'audio',
    id: `track_${track.id}`,
    audio_url: track.telegram_file_id || track.audio_url,
    title: track.title || 'MusicVerse Track',
    performer,
    audio_duration: track.duration_seconds || 0,
    caption: `🎵 *${escapedTitle}*\n👤 ${escapedPerformer}${escapedStyle}\n\n🔗 ${escapedDeepLink}`,
    parse_mode: 'MarkdownV2',
    thumbnail_url: track.cover_url,
    reply_markup: { 
      inline_keyboard: [
        [{ text: '🎵 Открыть трек', url: deepLink }]
      ] 
    }
  };
}

/**
 * Create project inline result (as article with link)
 */
function createProjectResult(project: any, trackCount: number, username?: string): InlineQueryResultArticle {
  const deepLink = getProjectDeepLink(project.id);
  const performer = username ? `@${username}` : 'MusicVerse';
  
  const statusEmoji: Record<string, string> = {
    'draft': '📝',
    'in_progress': '🔄',
    'completed': '✅',
    'released': '🚀',
    'published': '🌐',
  };

  const typeEmoji: Record<string, string> = {
    'single': '🎵',
    'ep': '💿',
    'album': '📀',
    'mixtape': '🎚️',
  };

  const status = statusEmoji[project.status] || '📝';
  const type = typeEmoji[project.project_type] || '🎵';
  const title = project.title || 'Проект';
  
  // Build description
  const descParts: string[] = [];
  if (project.genre) descParts.push(project.genre);
  if (project.mood) descParts.push(project.mood);
  descParts.push(`${trackCount} треков`);
  
  const description = descParts.join(' • ');

  // Message text (MarkdownV2)
  const escapedTitle = escapeMarkdown(title);
  const escapedPerformer = escapeMarkdown(performer);
  const escapedDesc = project.description ? `\n\n_${escapeMarkdown(project.description.substring(0, 100))}_` : '';
  const genreLine = project.genre ? `\n🎵 ${escapeMarkdown(project.genre)}` : '';
  const escapedDeepLink = escapeMarkdown(deepLink);

  const messageText = `📁 *${escapedTitle}*\n${type} ${status} • 👤 ${escapedPerformer}${genreLine}${escapedDesc}\n\n🎵 Треков: ${trackCount}\n\n🔗 ${escapedDeepLink}`;

  return {
    type: 'article',
    id: `project_${project.id}`,
    title: `📁 ${title}`,
    description: `${status} ${description}`,
    thumbnail_url: project.cover_url || DEFAULT_PROJECT_COVER,
    thumbnail_width: 100,
    thumbnail_height: 100,
    input_message_content: {
      message_text: messageText,
      parse_mode: 'MarkdownV2'
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: '📁 Открыть проект', url: deepLink }]
      ]
    }
  };
}

/**
 * Log inline search for analytics
 */
async function logInlineSearch(userId: string, telegramId: number, query: string, resultsCount: number) {
  try {
    const category = query.startsWith('project_') ? 'project_share' 
      : query.startsWith('track_') ? 'track_share'
      : query.startsWith('p:') ? 'project_search'
      : 'track_search';

    await supabase.from('inline_search_history').insert({
      user_id: userId,
      telegram_user_id: telegramId,
      query: query.substring(0, 100),
      results_count: resultsCount,
      category
    });
  } catch (e) {
    // Silent fail - analytics shouldn't break main flow
  }
}

/**
 * Answer inline query via Telegram API
 */
async function answerInlineQuery(id: string, results: InlineQueryResult[], options?: any) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      inline_query_id: id, 
      results,
      ...options 
    }),
  });
}
