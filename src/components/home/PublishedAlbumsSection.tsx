/**
 * Section displaying published albums/projects on homepage
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Disc3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlbumCard } from './AlbumCard';

interface PublishedAlbum {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  mood: string | null;
  user_id: string;
  published_at: string | null;
  total_tracks_count: number | null;
  approved_tracks_count: number | null;
  profiles?: {
    username: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
}

export function PublishedAlbumsSection() {
  const navigate = useNavigate();
  
  const { data: albums, isLoading } = useQuery({
    queryKey: ['published-albums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_projects')
        .select(`
          id,
          title,
          cover_url,
          description,
          genre,
          mood,
          user_id,
          published_at,
          total_tracks_count,
          approved_tracks_count,
          profiles!music_projects_user_id_fkey (
            username,
            display_name,
            photo_url
          )
        `)
        .eq('is_public', true)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as PublishedAlbum[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Новые альбомы</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-40 h-52 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!albums || albums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Новые альбомы</h2>
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => navigate(`/album/${album.id}`)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
