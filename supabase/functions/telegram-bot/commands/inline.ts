import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { logger } from '../utils/index.ts';

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
      await answerInlineQuery(id, [], { button: { text: '🔑 Войти', web_app: { url: BOT_CONFIG.miniAppUrl } } });
      return;
    }

    const pageSize = 20;
    const offsetNum = parseInt(offset) || 0;
    let results: InlineQueryResult[] = [];

    let tracksQuery = supabase
      .from('tracks')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + pageSize - 1);

    if (query.startsWith('track_')) {
      const trackId = query.replace('track_', '');
      const { data: track } = await supabase.from('tracks').select('*').eq('id', trackId).single();
      if (track?.audio_url) results.push(createResult(track, profile.username));
    } else {
      if (query.trim()) {
        tracksQuery = tracksQuery.or(`title.ilike.%${query}%,style.ilike.%${query}%`);
      }
      const { data: tracks } = await tracksQuery;
      results = (tracks || []).map(t => createResult(t, profile.username));
    }

    await answerInlineQuery(id, results, {
      cache_time: 60,
      is_personal: true,
      next_offset: results.length === pageSize ? String(offsetNum + pageSize) : ''
    });
  } catch (error) {
    logger.error('inline_query_error', error);
    await answerInlineQuery(id, []);
  }
}

function createResult(track: any, username?: string): InlineQueryResult {
  const deepLink = `${BOT_CONFIG.deepLinkBase}?startapp=track_${track.id}`;
  const performer = username ? `@${username}` : 'MusicVerse AI';
  
  return {
    type: 'audio',
    id: track.id,
    audio_url: track.telegram_file_id || track.audio_url,
    title: track.title || 'MusicVerse Track',
    performer,
    audio_duration: track.duration_seconds || 0,
    caption: `🎵 *${track.title || 'Трек'}*\n👤 ${performer}\n🔗 ${deepLink}`,
    parse_mode: 'Markdown',
    thumbnail_url: track.cover_url,
    reply_markup: { inline_keyboard: [[{ text: '🎵 Открыть', url: deepLink }]] }
  };
}

async function answerInlineQuery(id: string, results: InlineQueryResult[], options?: any) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inline_query_id: id, results, cache_time: 60, is_personal: true, ...options }),
  });
}
