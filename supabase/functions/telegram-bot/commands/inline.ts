import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

interface InlineQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  query: string;
  offset: string;
}

interface InlineKeyboardMarkup {
  inline_keyboard: Array<Array<{
    text: string;
    web_app?: { url: string };
  }>>;
}

interface InlineQueryResult {
  type: string;
  id: string;
  title: string;
  description?: string;
  thumb_url?: string;
  audio_url?: string;
  caption?: string;
  parse_mode?: string;
  reply_markup?: InlineKeyboardMarkup;
}

export async function handleInlineQuery(inlineQuery: InlineQuery) {
  const { id, query, from } = inlineQuery;
  
  try {
    // Get user from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', from.id)
      .single();

    if (!profile) {
      await answerInlineQuery(id, [], {
        cache_time: 0,
        is_personal: true,
        switch_pm_text: 'Войти в приложение',
        switch_pm_parameter: 'start'
      });
      return;
    }

    let results: InlineQueryResult[] = [];

    // Handle track sharing: track_<id>
    if (query.startsWith('track_')) {
      const trackId = query.replace('track_', '');
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      if (track && track.audio_url) {
        const durationSeconds = track.duration_seconds || 0;
        results.push({
          type: 'audio',
          id: track.id,
          title: track.title || 'MusicVerse Track',
          audio_url: track.audio_url,
          caption: `🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 ${track.style}` : ''}\n\n✨ Создано с помощью MusicVerse AI`,
          parse_mode: 'Markdown',
          thumb_url: track.cover_url,
          reply_markup: {
            inline_keyboard: [[
              { text: '🎵 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` } }
            ]]
          }
        });
      }
    }
    // Search tracks
    else if (query.length > 0) {
      const { data: tracks } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'completed')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tracks) {
        results = tracks
          .filter(track => track.audio_url)
          .map(track => ({
            type: 'audio',
            id: track.id,
            title: track.title || 'MusicVerse Track',
            description: track.style || 'AI Generated Music',
            audio_url: track.audio_url!,
            caption: `🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 ${track.style}` : ''}\n\n✨ Создано с помощью MusicVerse AI`,
            parse_mode: 'Markdown',
            thumb_url: track.cover_url,
            reply_markup: {
              inline_keyboard: [[
                { text: '🎵 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${track.id}` } }
              ]]
            }
          }));
      }
    }
    // Show recent tracks
    else {
      const { data: tracks } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (tracks) {
        results = tracks
          .filter(track => track.audio_url)
          .map(track => ({
            type: 'audio',
            id: track.id,
            title: track.title || 'MusicVerse Track',
            description: track.style || 'AI Generated Music',
            audio_url: track.audio_url!,
            caption: `🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 ${track.style}` : ''}\n\n✨ Создано с помощью MusicVerse AI`,
            parse_mode: 'Markdown',
            thumb_url: track.cover_url,
            reply_markup: {
              inline_keyboard: [[
                { text: '🎵 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${track.id}` } }
              ]]
            }
          }));
      }
    }

    await answerInlineQuery(id, results, {
      cache_time: 30,
      is_personal: true
    });

  } catch (error) {
    console.error('Error handling inline query:', error);
    await answerInlineQuery(id, [], {
      cache_time: 0,
      is_personal: true,
      switch_pm_text: 'Ошибка. Попробуйте снова',
      switch_pm_parameter: 'start'
    });
  }
}

async function answerInlineQuery(
  inlineQueryId: string, 
  results: InlineQueryResult[],
  options?: {
    cache_time?: number;
    is_personal?: boolean;
    switch_pm_text?: string;
    switch_pm_parameter?: string;
  }
) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: inlineQueryId,
      results,
      ...options
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram API error:', error);
  }

  return response.json();
}