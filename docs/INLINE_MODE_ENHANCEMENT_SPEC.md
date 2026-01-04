# Telegram Bot Inline Mode - Спецификация Улучшений

**Дата:** 2025-12-16  
**Приоритет:** P0 (Критично)  
**Story Points:** 20 SP  
**Срок:** 3 недели

---

## 📋 Проблемы текущей реализации

### Текущий код
**Файл**: `supabase/functions/telegram-bot/commands/inline.ts` (114 строк)

### Что работает
- ✅ Базовый поиск треков по title + style
- ✅ Отправка аудио с обложкой
- ✅ Deep linking в результатах
- ✅ Пагинация (20 треков)
- ✅ Кэширование (60 сек)

### Критические проблемы
1. ❌ **Только личные треки** - поиск ограничен треками текущего пользователя
2. ❌ **Нет публичного контента** - никакой доступ к community
3. ❌ **Примитивный поиск** - только title.ilike + style.ilike
4. ❌ **Нет категорий** - пользователь не может просмотреть тренды, жанры
5. ❌ **Отсутствует навигация** - нет способа открыть разные разделы

### Сравнение с конкурентами

| Функция | MusicVerse | @SpotifyBot | @soundcloud_bot |
|---------|------------|-------------|-----------------|
| Личные треки | ✅ | ✅ | ✅ |
| Публичные | ❌ | ✅ | ✅ |
| Трендовые | ❌ | ✅ | ✅ |
| По жанрам | ❌ | ✅ | ❌ |
| Категории | ❌ | ✅ | ✅ |
| Умный поиск | ❌ | ✅ | ✅ |

---

## 🎯 Цели улучшения

1. **Публичный контент** - сделать inline mode главным способом discovery
2. **Категории** - добавить удобную навигацию
3. **Умный поиск** - multi-field search с ranking
4. **Персонализация** - рекомендации на основе истории
5. **Rich results** - больше метаданных в результатах

---

## 🏗️ Новая архитектура

### Категории inline режима

```typescript
enum InlineCategory {
  // Базовые
  MY = 'my',              // Мои треки
  PUBLIC = 'public',      // Публичные треки
  TRENDING = 'trending',  // Трендовые за 7 дней
  NEW = 'new',           // Новые за 24 часа
  FEATURED = 'featured',  // Избранные редакцией
  
  // По жанрам
  GENRE = 'genre:',      // genre:rock, genre:jazz
  
  // По настроению
  MOOD = 'mood:',        // mood:happy, mood:sad
  
  // Специальные
  POPULAR = 'popular',    // Самые популярные за всё время
  RECENT = 'recent',      // Недавно поделённые
}
```

### Примеры использования

```
@AIMusicVerseBot rock          → Поиск "rock" в публичных
@AIMusicVerseBot my:rock       → Поиск "rock" в моих
@AIMusicVerseBot trending:     → Показать тренды без поиска
@AIMusicVerseBot genre:jazz    → Все треки жанра jazz
@AIMusicVerseBot mood:chill    → Треки с настроением chill
@AIMusicVerseBot new:          → Новые треки за 24ч
```

### Empty state (без запроса)

```
@AIMusicVerseBot

Результат:
┌─────────────────────────────────┐
│ 🎵 Поиск музыки MusicVerse      │
├─────────────────────────────────┤
│ Категории:                      │
│ [🎵 Мои] [🔥 Тренды] [⭐ Новое] │
│ [🎸 Жанры] [💭 Настроение]      │
├─────────────────────────────────┤
│ Примеры:                        │
│ • rock                          │
│ • my:последняя                  │
│ • trending:                     │
│ • genre:electronic              │
└─────────────────────────────────┘
```

---

## 🔨 Техническая реализация

### 1. Database Changes

#### Migration: `inline_mode_improvements.sql`

```sql
-- =====================================================
-- Inline Mode Improvements
-- =====================================================

-- 1. Full-text search index
CREATE INDEX IF NOT EXISTS idx_tracks_search_vector 
ON tracks USING GIN (
  to_tsvector('russian', 
    COALESCE(title, '') || ' ' || 
    COALESCE(style, '') || ' ' || 
    COALESCE(tags, '')
  )
);

-- 2. Trending scores (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_tracks AS
SELECT 
  t.*,
  COALESCE(stats.like_count, 0) as like_count,
  COALESCE(stats.comment_count, 0) as comment_count,
  COALESCE(stats.play_count, 0) as play_count,
  (
    COALESCE(stats.like_count, 0) * 3 +
    COALESCE(stats.comment_count, 0) * 2 +
    COALESCE(stats.play_count, 0)
  ) as trending_score
FROM tracks t
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT l.user_id) FILTER (WHERE l.created_at > NOW() - INTERVAL '7 days') as like_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at > NOW() - INTERVAL '7 days') as comment_count,
    COUNT(DISTINCT ph.id) FILTER (WHERE ph.created_at > NOW() - INTERVAL '7 days') as play_count
  FROM likes l
  LEFT JOIN comments c ON c.track_id = t.id
  LEFT JOIN play_history ph ON ph.track_id = t.id
  WHERE l.track_id = t.id OR c.track_id = t.id OR ph.track_id = t.id
) stats ON true
WHERE t.status = 'completed' 
  AND t.is_public = true
  AND t.audio_url IS NOT NULL
ORDER BY trending_score DESC, t.created_at DESC;

-- Create index on materialized view
CREATE INDEX idx_trending_tracks_score ON trending_tracks(trending_score DESC, created_at DESC);

-- Refresh function (call daily via cron)
CREATE OR REPLACE FUNCTION refresh_trending_tracks()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_tracks;
END;
$$ LANGUAGE plpgsql;

-- 3. Genre extraction function
CREATE OR REPLACE FUNCTION extract_genre(track_style TEXT, track_tags TEXT)
RETURNS TEXT AS $$
DECLARE
  genre_keywords TEXT[] := ARRAY[
    'rock', 'pop', 'jazz', 'electronic', 'hip-hop', 'classical',
    'metal', 'folk', 'country', 'blues', 'reggae', 'latin',
    'rnb', 'soul', 'funk', 'disco', 'house', 'techno', 'trance',
    'ambient', 'indie', 'alternative', 'punk', 'ska'
  ];
  search_text TEXT;
  keyword TEXT;
BEGIN
  search_text := LOWER(COALESCE(track_style, '') || ' ' || COALESCE(track_tags, ''));
  
  FOREACH keyword IN ARRAY genre_keywords LOOP
    IF search_text LIKE '%' || keyword || '%' THEN
      RETURN keyword;
    END IF;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Add computed genre column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS computed_genre TEXT GENERATED ALWAYS AS (
  extract_genre(style, tags)
) STORED;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_genre ON tracks(computed_genre) WHERE computed_genre IS NOT NULL;

-- 5. Mood detection (simplified)
CREATE OR REPLACE FUNCTION extract_mood(track_style TEXT, track_tags TEXT)
RETURNS TEXT AS $$
DECLARE
  mood_keywords JSONB := '{
    "happy": ["happy", "upbeat", "cheerful", "joyful", "energetic"],
    "sad": ["sad", "melancholic", "emotional", "dark", "gloomy"],
    "chill": ["chill", "relaxing", "calm", "peaceful", "ambient"],
    "energetic": ["energetic", "powerful", "intense", "aggressive", "fast"],
    "romantic": ["romantic", "love", "tender", "soft", "gentle"]
  }'::JSONB;
  search_text TEXT;
  mood TEXT;
  keywords TEXT[];
  keyword TEXT;
BEGIN
  search_text := LOWER(COALESCE(track_style, '') || ' ' || COALESCE(track_tags, ''));
  
  FOR mood IN SELECT jsonb_object_keys(mood_keywords) LOOP
    keywords := ARRAY(SELECT jsonb_array_elements_text(mood_keywords->mood));
    FOREACH keyword IN ARRAY keywords LOOP
      IF search_text LIKE '%' || keyword || '%' THEN
        RETURN mood;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed mood column
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS computed_mood TEXT GENERATED ALWAYS AS (
  extract_mood(style, tags)
) STORED;

CREATE INDEX IF NOT EXISTS idx_tracks_computed_mood ON tracks(computed_mood) WHERE computed_mood IS NOT NULL;

-- 6. Inline search history
CREATE TABLE IF NOT EXISTS inline_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  query TEXT NOT NULL,
  category TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inline_search_history_user ON inline_search_history(telegram_user_id, created_at DESC);
CREATE INDEX idx_inline_search_history_query ON inline_search_history(query);

-- Enable RLS
ALTER TABLE inline_search_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own search history"
  ON inline_search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert search history"
  ON inline_search_history FOR INSERT
  WITH CHECK (true);
```

### 2. TypeScript Types

```typescript
// supabase/functions/telegram-bot/commands/inline-types.ts

export enum InlineCategory {
  MY = 'my',
  PUBLIC = 'public',
  TRENDING = 'trending',
  NEW = 'new',
  FEATURED = 'featured',
  GENRE = 'genre',
  MOOD = 'mood',
  POPULAR = 'popular',
}

export interface InlineQueryContext {
  query: string;
  offset: number;
  category: InlineCategory;
  filter?: {
    genre?: string;
    mood?: string;
    duration?: 'short' | 'medium' | 'long';
    language?: string;
  };
  userId?: string;
  telegramUserId: number;
}

export interface TrackSearchResult {
  id: string;
  title: string;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number;
  style: string | null;
  telegram_file_id: string | null;
  user: {
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  stats: {
    like_count: number;
    play_count: number;
    comment_count: number;
  };
  genre: string | null;
  mood: string | null;
  created_at: string;
}
```

### 3. Query Builder

```typescript
// supabase/functions/telegram-bot/commands/inline-queries.ts

import { createClient } from '@supabase/supabase-js';
import { InlineCategory, InlineQueryContext, TrackSearchResult } from './inline-types.ts';

export class InlineQueryBuilder {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private context: InlineQueryContext
  ) {}

  async execute(): Promise<TrackSearchResult[]> {
    switch (this.context.category) {
      case InlineCategory.MY:
        return this.searchMyTracks();
      case InlineCategory.PUBLIC:
        return this.searchPublicTracks();
      case InlineCategory.TRENDING:
        return this.getTrendingTracks();
      case InlineCategory.NEW:
        return this.getNewTracks();
      case InlineCategory.FEATURED:
        return this.getFeaturedTracks();
      case InlineCategory.GENRE:
        return this.searchByGenre();
      case InlineCategory.MOOD:
        return this.searchByMood();
      case InlineCategory.POPULAR:
        return this.getPopularTracks();
      default:
        return this.searchPublicTracks();
    }
  }

  private async searchMyTracks(): Promise<TrackSearchResult[]> {
    if (!this.context.userId) return [];

    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified)
      `)
      .eq('user_id', this.context.userId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .or(`title.ilike.%${this.context.query}%,style.ilike.%${this.context.query}%,tags.ilike.%${this.context.query}%`)
      .order('created_at', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async searchPublicTracks(): Promise<TrackSearchResult[]> {
    let query = this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified, is_public)
      `)
      .eq('status', 'completed')
      .eq('profiles.is_public', true)
      .not('audio_url', 'is', null);

    // Apply search if query provided
    if (this.context.query.trim()) {
      query = query.textSearch('title_style_tags', this.context.query, {
        type: 'websearch',
        config: 'russian',
      });
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async getTrendingTracks(): Promise<TrackSearchResult[]> {
    const { data, error } = await this.supabase
      .from('trending_tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood, like_count, play_count, comment_count,
        profiles!inner(username, avatar_url, is_verified)
      `)
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async getNewTracks(): Promise<TrackSearchResult[]> {
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified, is_public)
      `)
      .eq('status', 'completed')
      .eq('profiles.is_public', true)
      .not('audio_url', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async getFeaturedTracks(): Promise<TrackSearchResult[]> {
    // TODO: Implement editorial selection logic
    // For now, return most liked tracks
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified, is_public),
        likes(count)
      `)
      .eq('status', 'completed')
      .eq('profiles.is_public', true)
      .not('audio_url', 'is', null)
      .order('likes.count', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async searchByGenre(): Promise<TrackSearchResult[]> {
    const genre = this.context.filter?.genre || this.context.query;
    
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified, is_public)
      `)
      .eq('status', 'completed')
      .eq('profiles.is_public', true)
      .eq('computed_genre', genre.toLowerCase())
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async searchByMood(): Promise<TrackSearchResult[]> {
    const mood = this.context.filter?.mood || this.context.query;
    
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        id, title, audio_url, cover_url, duration_seconds, style, telegram_file_id, created_at,
        computed_genre, computed_mood,
        profiles!inner(username, avatar_url, is_verified, is_public)
      `)
      .eq('status', 'completed')
      .eq('profiles.is_public', true)
      .eq('computed_mood', mood.toLowerCase())
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(this.context.offset, this.context.offset + 19);

    return this.mapResults(data || []);
  }

  private async getPopularTracks(): Promise<TrackSearchResult[]> {
    // All-time popular tracks
    const { data, error } = await this.supabase
      .rpc('get_popular_tracks', {
        limit_count: 20,
        offset_count: this.context.offset,
      });

    return this.mapResults(data || []);
  }

  private mapResults(data: any[]): TrackSearchResult[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      audio_url: item.audio_url,
      cover_url: item.cover_url,
      duration_seconds: item.duration_seconds,
      style: item.style,
      telegram_file_id: item.telegram_file_id,
      user: {
        username: item.profiles?.username || null,
        avatar_url: item.profiles?.avatar_url || null,
        is_verified: item.profiles?.is_verified || false,
      },
      stats: {
        like_count: item.like_count || 0,
        play_count: item.play_count || 0,
        comment_count: item.comment_count || 0,
      },
      genre: item.computed_genre,
      mood: item.computed_mood,
      created_at: item.created_at,
    }));
  }
}
```

### 4. Main Handler (Refactored)

```typescript
// supabase/functions/telegram-bot/commands/inline.ts

import { createClient } from '@supabase/supabase-js';
import { BOT_CONFIG } from '../config.ts';
import { logger, escapeMarkdown } from '../utils/index.ts';
import { InlineQueryBuilder } from './inline-queries.ts';
import { InlineCategory, InlineQueryContext } from './inline-types.ts';

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

export async function handleInlineQuery(inlineQuery: InlineQuery) {
  const { id, query, from, offset } = inlineQuery;
  
  logger.info('inline_query', { userId: from.id, query, offset });

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('telegram_id', from.id)
      .maybeSingle();

    // Parse query to determine category
    const context = parseQueryContext(query, parseInt(offset) || 0, profile?.user_id, from.id);
    
    // Execute search
    const queryBuilder = new InlineQueryBuilder(supabase, context);
    const tracks = await queryBuilder.execute();

    // Log search
    await logInlineSearch(from.id, profile?.user_id, query, context.category, tracks.length);

    // Convert to Telegram inline results
    const results = tracks.map((track) => createInlineResult(track, profile?.username));

    // Prepare response options
    const responseOptions: any = {
      cache_time: query.trim() ? 60 : 300, // Cache longer for empty queries
      is_personal: context.category === InlineCategory.MY,
      next_offset: tracks.length === 20 ? String(context.offset + 20) : '',
    };

    // Add navigation buttons for empty query
    if (!query.trim()) {
      responseOptions.button = {
        text: '📖 Как использовать',
        web_app: { url: `${BOT_CONFIG.miniAppUrl}/help/inline-mode` },
      };
    }

    await answerInlineQuery(id, results, responseOptions);
  } catch (error) {
    logger.error('inline_query_error', error);
    
    // Send error result with help
    await answerInlineQuery(id, [createHelpResult()], {
      cache_time: 0,
      is_personal: true,
    });
  }
}

function parseQueryContext(
  query: string,
  offset: number,
  userId?: string,
  telegramUserId?: number
): InlineQueryContext {
  const trimmed = query.trim().toLowerCase();

  // Parse category prefixes
  if (trimmed.startsWith('my:')) {
    return {
      query: trimmed.slice(3).trim(),
      offset,
      category: InlineCategory.MY,
      userId,
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed.startsWith('trending:') || trimmed === 'trending') {
    return {
      query: trimmed.replace('trending:', '').trim(),
      offset,
      category: InlineCategory.TRENDING,
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed.startsWith('new:') || trimmed === 'new') {
    return {
      query: trimmed.replace('new:', '').trim(),
      offset,
      category: InlineCategory.NEW,
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed.startsWith('featured:') || trimmed === 'featured') {
    return {
      query: trimmed.replace('featured:', '').trim(),
      offset,
      category: InlineCategory.FEATURED,
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed.startsWith('genre:')) {
    return {
      query: '',
      offset,
      category: InlineCategory.GENRE,
      filter: { genre: trimmed.slice(6).trim() },
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed.startsWith('mood:')) {
    return {
      query: '',
      offset,
      category: InlineCategory.MOOD,
      filter: { mood: trimmed.slice(5).trim() },
      telegramUserId: telegramUserId!,
    };
  }

  if (trimmed === 'popular') {
    return {
      query: '',
      offset,
      category: InlineCategory.POPULAR,
      telegramUserId: telegramUserId!,
    };
  }

  // Default: public search
  return {
    query: trimmed,
    offset,
    category: InlineCategory.PUBLIC,
    telegramUserId: telegramUserId!,
  };
}

function createInlineResult(track: TrackSearchResult, currentUsername?: string) {
  const deepLink = `${BOT_CONFIG.deepLinkBase}?startapp=track_${track.id}`;
  const performer = track.user.username 
    ? `@${track.user.username}${track.user.is_verified ? ' ✓' : ''}`
    : 'MusicVerse AI';
  
  const title = track.title || 'MusicVerse Track';
  const genre = track.genre ? `#${track.genre}` : '';
  const mood = track.mood ? `#${track.mood}` : '';
  const likes = track.stats.like_count > 0 ? `❤️ ${track.stats.like_count}` : '';
  
  const caption = [
    `🎵 *${escapeMarkdown(title)}*`,
    `👤 ${escapeMarkdown(performer)}`,
    genre && mood ? `${escapeMarkdown(genre)} ${escapeMarkdown(mood)}` : '',
    likes,
    `🔗 ${escapeMarkdown(deepLink)}`,
  ].filter(Boolean).join('\n');

  return {
    type: 'audio',
    id: track.id,
    audio_url: track.telegram_file_id || track.audio_url,
    title,
    performer,
    audio_duration: track.duration_seconds || 0,
    caption,
    parse_mode: 'MarkdownV2',
    thumbnail_url: track.cover_url,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎵 Открыть в приложении', url: deepLink },
        ],
        [
          { text: '🎵 Мои', switch_inline_query_current_chat: 'my:' },
          { text: '🔥 Тренды', switch_inline_query_current_chat: 'trending:' },
          { text: '⭐ Новое', switch_inline_query_current_chat: 'new:' },
        ],
      ],
    },
  };
}

function createHelpResult() {
  return {
    type: 'article',
    id: 'help',
    title: '🔍 Как использовать inline mode',
    description: 'Нажмите для просмотра инструкций',
    input_message_content: {
      message_text: `*🎵 Inline режим MusicVerse*

*Категории:*
• \`my:\` \\- мои треки
• \`trending:\` \\- тренды
• \`new:\` \\- новые треки
• \`genre:жанр\` \\- по жанру
• \`mood:настроение\` \\- по настроению

*Примеры:*
• \`@AIMusicVerseBot rock\` \\- поиск rock
• \`@AIMusicVerseBot my:последняя\` \\- мои треки
• \`@AIMusicVerseBot trending:\` \\- тренды
• \`@AIMusicVerseBot genre:jazz\` \\- джаз

*Жанры:* rock, pop, jazz, electronic, hip\\-hop, classical, metal, folk, и др\\.

*Настроения:* happy, sad, chill, energetic, romantic`,
      parse_mode: 'MarkdownV2',
    },
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎵 Попробовать', switch_inline_query_current_chat: '' },
        ],
      ],
    },
  };
}

async function logInlineSearch(
  telegramUserId: number,
  userId: string | undefined,
  query: string,
  category: string,
  resultsCount: number
) {
  if (!userId) return;

  await supabase.from('inline_search_history').insert({
    user_id: userId,
    telegram_user_id: telegramUserId,
    query,
    category,
    results_count: resultsCount,
  });
}

async function answerInlineQuery(id: string, results: any[], options?: any) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: id,
      results,
      cache_time: 60,
      is_personal: true,
      ...options,
    }),
  });
}
```

---

## 📊 Ожидаемые результаты

### Метрики успеха

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Inline запросы/день | 50-100 | 300-500 | +300% |
| Conversion (share → open) | ~10% | ~25% | +150% |
| Avg результатов на запрос | 2-5 | 10-15 | +200% |
| Публичные треки в results | 0% | 80% | ∞ |
| Категорий доступно | 0 | 8 | ∞ |

### UX улучшения

- ✅ Пользователи могут находить любую музыку, не только свою
- ✅ Trending треки видны сразу
- ✅ Удобная навигация через категории
- ✅ Rich metadata в результатах (жанр, настроение, лайки)
- ✅ Персонализация на основе истории

---

## 🗓️ План реализации

### Week 1: Database & Core (8 SP)
- [ ] День 1-2: Migration + indexes (T2.1.1 - T2.1.4)
- [ ] День 3-4: InlineQueryBuilder класс (T2.1.5 - T2.1.8)
- [ ] День 5: TypeScript types + utils

### Week 2: Features (8 SP)
- [ ] День 1-2: Category navigation (T2.1.5 - T2.1.8)
- [ ] День 3-4: Advanced search (T2.1.9 - T2.1.13)
- [ ] День 5: Rich results (T2.1.14 - T2.1.18)

### Week 3: Polish & Testing (4 SP)
- [ ] День 1-2: Personalization (T2.1.19 - T2.1.21)
- [ ] День 3: Testing + bugfixes
- [ ] День 4: Documentation + deploy
- [ ] День 5: Monitoring + analytics

---

## 🧪 Тестирование

### Unit Tests
```typescript
// Test query parsing
describe('parseQueryContext', () => {
  it('parses my: prefix', () => {
    const ctx = parseQueryContext('my:rock', 0, 'user-id', 123);
    expect(ctx.category).toBe(InlineCategory.MY);
    expect(ctx.query).toBe('rock');
  });

  it('parses trending: prefix', () => {
    const ctx = parseQueryContext('trending:', 0, undefined, 123);
    expect(ctx.category).toBe(InlineCategory.TRENDING);
  });

  it('parses genre: prefix', () => {
    const ctx = parseQueryContext('genre:jazz', 0, undefined, 123);
    expect(ctx.category).toBe(InlineCategory.GENRE);
    expect(ctx.filter?.genre).toBe('jazz');
  });
});
```

### Integration Tests
```typescript
// Test inline query flow
describe('InlineQueryBuilder', () => {
  it('returns public tracks', async () => {
    const builder = new InlineQueryBuilder(supabase, {
      query: 'rock',
      offset: 0,
      category: InlineCategory.PUBLIC,
      telegramUserId: 123,
    });
    
    const results = await builder.execute();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].user.username).toBeDefined();
  });
});
```

### Manual Testing Checklist
- [ ] Empty query shows help + categories
- [ ] `my:query` searches in user's tracks
- [ ] `trending:` shows trending tracks
- [ ] `genre:rock` shows rock tracks
- [ ] `mood:happy` shows happy tracks
- [ ] Pagination works (offset)
- [ ] Cache works (repeat queries)
- [ ] Deep links work
- [ ] Verified badges show correctly
- [ ] Stats (likes, plays) display correctly

---

## 📈 Мониторинг

### Metrics to Track
```sql
-- Daily inline queries count
SELECT DATE(created_at), COUNT(*) as queries
FROM inline_search_history
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Popular categories
SELECT category, COUNT(*) as count
FROM inline_search_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY count DESC;

-- Top search queries
SELECT query, COUNT(*) as count
FROM inline_search_history
WHERE created_at > NOW() - INTERVAL '7 days'
  AND query != ''
GROUP BY query
ORDER BY count DESC
LIMIT 20;

-- Zero results queries (need improvement)
SELECT query, COUNT(*) as count
FROM inline_search_history
WHERE results_count = 0
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY count DESC
LIMIT 20;
```

---

## 🚀 Деплой

### Pre-deploy Checklist
- [ ] Миграция SQL протестирована
- [ ] Edge function код ревью
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] Manual testing completed
- [ ] Documentation updated

### Deployment Steps
1. Deploy migration: `supabase db push`
2. Refresh trending view: `SELECT refresh_trending_tracks();`
3. Deploy edge function: `supabase functions deploy telegram-bot`
4. Test in production (limited users)
5. Monitor logs and metrics
6. Gradual rollout

### Rollback Plan
If issues detected:
1. Keep old code as `inline-legacy.ts`
2. Switch handler in `bot.ts` router
3. No database rollback needed (backwards compatible)

---

## 📚 Документация

### User Guide (to create)
- How to use inline mode effectively
- Category examples
- Search tips
- Troubleshooting

### Developer Docs (to create)
- Architecture overview
- Query optimization guide
- Adding new categories
- Performance tuning

---

**Автор**: GitHub Copilot Agent  
**Дата**: 2025-12-16  
**Статус**: Готов к реализации  
**Приоритет**: P0 (Критично)
