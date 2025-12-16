/**
 * Section displaying published albums/projects on homepage
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Disc3, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlbumCard } from './AlbumCard';
import { motion } from '@/lib/motion';

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
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Disc3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Новые альбомы</h2>
            <p className="text-xs text-muted-foreground">Релизы сообщества</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-44 h-60 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!albums || albums.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Disc3 className="w-5 h-5 text-purple-500" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Новые альбомы</h2>
              <Badge variant="secondary" className="text-[10px] h-4 gap-0.5 bg-purple-500/10 text-purple-500 border-purple-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                {albums.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Релизы сообщества</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
        >
          Все альбомы
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-4 pb-3">
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <AlbumCard
                album={album}
                onClick={() => navigate(`/album/${album.id}`)}
                isNew={index === 0}
              />
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
