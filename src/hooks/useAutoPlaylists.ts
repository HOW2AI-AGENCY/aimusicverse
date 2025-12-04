import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GenrePlaylist {
  id: string;
  genre: string;
  title: string;
  description: string;
  tracks: any[];
  cover_url?: string;
}

const GENRE_PLAYLISTS = [
  { genre: 'electronic', title: 'Электроника', description: 'Лучшие электронные треки' },
  { genre: 'hip-hop', title: 'Хип-Хоп', description: 'Свежий хип-хоп и рэп' },
  { genre: 'pop', title: 'Поп', description: 'Популярная музыка' },
  { genre: 'rock', title: 'Рок', description: 'Энергичный рок' },
  { genre: 'ambient', title: 'Амбиент', description: 'Атмосферная музыка' },
  { genre: 'jazz', title: 'Джаз', description: 'Классический и современный джаз' },
];

export function useAutoPlaylists() {
  return useQuery({
    queryKey: ['auto-playlists'],
    queryFn: async () => {
      // Fetch public tracks grouped by genre/style
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .order('play_count', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group tracks by detected genre from style or tags
      const playlists: GenrePlaylist[] = GENRE_PLAYLISTS.map(({ genre, title, description }) => {
        const genreTracks = (tracks || []).filter(track => {
          const style = (track.style || '').toLowerCase();
          const tags = (track.tags || '').toLowerCase();
          return style.includes(genre) || tags.includes(genre);
        }).slice(0, 20);

        return {
          id: `auto-${genre}`,
          genre,
          title,
          description,
          tracks: genreTracks.map(t => ({
            ...t,
            likes_count: 0,
            is_liked: false,
          })),
        };
      }).filter(p => p.tracks.length >= 3); // Only show playlists with at least 3 tracks

      return playlists;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
