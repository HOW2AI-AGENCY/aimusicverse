/**
 * Types for enhanced Inline Mode
 * Supports 8 categories with advanced filtering
 */

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
  style: string | null;
  tags: string | null;
  audio_url: string;
  cover_art_url: string | null;
  duration: number | null;
  created_at: string;
  user_id: string;
  creator_username?: string;
  creator_name?: string;
  computed_genre?: string | null;
  computed_mood?: string | null;
  trending_score?: number;
  quality_score?: number;
}

export interface ParsedInlineQuery {
  category: InlineCategory;
  searchQuery: string;
  filter: {
    genre?: string;
    mood?: string;
  };
}

/**
 * Parse inline query to extract category and filters
 * 
 * Examples:
 * - "rock" → { category: PUBLIC, searchQuery: "rock" }
 * - "my:rock" → { category: MY, searchQuery: "rock" }
 * - "trending:" → { category: TRENDING, searchQuery: "" }
 * - "genre:jazz" → { category: GENRE, filter: { genre: "jazz" } }
 * - "mood:chill" → { category: MOOD, filter: { mood: "chill" } }
 */
export function parseInlineQuery(query: string): ParsedInlineQuery {
  const trimmed = query.trim().toLowerCase();
  
  // Empty query defaults to PUBLIC with no search
  if (!trimmed) {
    return {
      category: InlineCategory.PUBLIC,
      searchQuery: '',
      filter: {},
    };
  }
  
  // Check for category prefixes
  if (trimmed.startsWith('my:')) {
    return {
      category: InlineCategory.MY,
      searchQuery: trimmed.substring(3).trim(),
      filter: {},
    };
  }
  
  if (trimmed.startsWith('public:')) {
    return {
      category: InlineCategory.PUBLIC,
      searchQuery: trimmed.substring(7).trim(),
      filter: {},
    };
  }
  
  if (trimmed.startsWith('trending:') || trimmed === 'trending') {
    return {
      category: InlineCategory.TRENDING,
      searchQuery: trimmed.startsWith('trending:') ? trimmed.substring(9).trim() : '',
      filter: {},
    };
  }
  
  if (trimmed.startsWith('new:') || trimmed === 'new') {
    return {
      category: InlineCategory.NEW,
      searchQuery: trimmed.startsWith('new:') ? trimmed.substring(4).trim() : '',
      filter: {},
    };
  }
  
  if (trimmed.startsWith('featured:') || trimmed === 'featured') {
    return {
      category: InlineCategory.FEATURED,
      searchQuery: trimmed.startsWith('featured:') ? trimmed.substring(9).trim() : '',
      filter: {},
    };
  }
  
  if (trimmed.startsWith('genre:')) {
    const genreValue = trimmed.substring(6).trim();
    return {
      category: InlineCategory.GENRE,
      searchQuery: '',
      filter: { genre: genreValue },
    };
  }
  
  if (trimmed.startsWith('mood:')) {
    const moodValue = trimmed.substring(5).trim();
    return {
      category: InlineCategory.MOOD,
      searchQuery: '',
      filter: { mood: moodValue },
    };
  }
  
  if (trimmed === 'popular') {
    return {
      category: InlineCategory.POPULAR,
      searchQuery: '',
      filter: {},
    };
  }
  
  // Default: PUBLIC category with search query
  return {
    category: InlineCategory.PUBLIC,
    searchQuery: trimmed,
    filter: {},
  };
}

/**
 * Build search query based on category and context
 */
export function buildSearchQuery(
  supabase: any,
  context: InlineQueryContext
): any {
  const pageSize = 20;
  let query;
  
  switch (context.category) {
    case InlineCategory.MY:
      // User's own tracks
      query = supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('user_id', context.userId)
        .eq('status', 'completed')
        .not('audio_url', 'is', null);
      
      if (context.query) {
        query = query.or(`title.ilike.%${context.query}%,style.ilike.%${context.query}%,tags.ilike.%${context.query}%`);
      }
      
      return query
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.PUBLIC:
      // Public tracks with optional search
      query = supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null);
      
      if (context.query) {
        // Use full-text search if available
        query = query.or(`title.ilike.%${context.query}%,style.ilike.%${context.query}%,tags.ilike.%${context.query}%`);
      }
      
      return query
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.TRENDING:
      // Trending tracks from materialized view
      query = supabase
        .from('trending_tracks')
        .select('*');
      
      if (context.query) {
        query = query.or(`title.ilike.%${context.query}%,style.ilike.%${context.query}%`);
      }
      
      return query.range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.NEW:
      // New tracks from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .gte('created_at', oneDayAgo);
      
      if (context.query) {
        query = query.or(`title.ilike.%${context.query}%,style.ilike.%${context.query}%`);
      }
      
      return query
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.FEATURED:
      // Featured/high-quality tracks using RPC function
      return supabase.rpc('get_featured_tracks', {
        limit_count: pageSize,
        offset_count: context.offset,
      });
    
    case InlineCategory.GENRE:
      // Filter by genre
      if (!context.filter?.genre) {
        // No genre specified, show all genres as options
        return supabase
          .from('tracks')
          .select('computed_genre')
          .eq('is_public', true)
          .not('computed_genre', 'is', null)
          .limit(10);
      }
      
      query = supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('is_public', true)
        .eq('status', 'completed')
        .eq('computed_genre', context.filter.genre)
        .not('audio_url', 'is', null);
      
      return query
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.MOOD:
      // Filter by mood
      if (!context.filter?.mood) {
        // No mood specified, show all moods as options
        return supabase
          .from('tracks')
          .select('computed_mood')
          .eq('is_public', true)
          .not('computed_mood', 'is', null)
          .limit(10);
      }
      
      query = supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('is_public', true)
        .eq('status', 'completed')
        .eq('computed_mood', context.filter.mood)
        .not('audio_url', 'is', null);
      
      return query
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
    
    case InlineCategory.POPULAR:
      // Most popular tracks of all time
      return supabase.rpc('get_featured_tracks', {
        limit_count: pageSize,
        offset_count: context.offset,
      });
    
    default:
      // Fallback to public search
      return supabase
        .from('tracks')
        .select('*, profiles!inner(username, display_name)')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false })
        .range(context.offset, context.offset + pageSize - 1);
  }
}

/**
 * Get category display name in Russian
 */
export function getCategoryName(category: InlineCategory): string {
  const names: Record<InlineCategory, string> = {
    [InlineCategory.MY]: 'Мои треки',
    [InlineCategory.PUBLIC]: 'Публичные',
    [InlineCategory.TRENDING]: 'Тренды',
    [InlineCategory.NEW]: 'Новое',
    [InlineCategory.FEATURED]: 'Избранное',
    [InlineCategory.GENRE]: 'По жанрам',
    [InlineCategory.MOOD]: 'По настроению',
    [InlineCategory.POPULAR]: 'Популярное',
  };
  return names[category] || 'Поиск';
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category: InlineCategory): string {
  const emojis: Record<InlineCategory, string> = {
    [InlineCategory.MY]: '🎵',
    [InlineCategory.PUBLIC]: '🌐',
    [InlineCategory.TRENDING]: '🔥',
    [InlineCategory.NEW]: '⭐',
    [InlineCategory.FEATURED]: '✨',
    [InlineCategory.GENRE]: '🎸',
    [InlineCategory.MOOD]: '💭',
    [InlineCategory.POPULAR]: '👑',
  };
  return emojis[category] || '🎵';
}
