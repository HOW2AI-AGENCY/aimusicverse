import { Music2, Play, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePlaybackQueue } from '@/hooks/usePlaybackQueue';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';

const GENRE_COLORS: Record<string, string> = {
  'electronic': 'from-cyan-500/30 to-blue-500/30',
  'hip-hop': 'from-orange-500/30 to-red-500/30',
  'pop': 'from-pink-500/30 to-purple-500/30',
  'rock': 'from-red-500/30 to-orange-500/30',
  'ambient': 'from-teal-500/30 to-green-500/30',
  'jazz': 'from-amber-500/30 to-yellow-500/30',
};

interface GenrePlaylist {
  id: string;
  genre: string;
  title: string;
  description: string;
  tracks: PublicTrackWithCreator[];
}

interface AutoPlaylistCardProps {
  playlist: GenrePlaylist;
  onPlay: () => void;
}

function AutoPlaylistCard({ playlist, onPlay }: AutoPlaylistCardProps) {
  const gradient = GENRE_COLORS[playlist.genre] || 'from-primary/30 to-primary/10';
  
  return (
    <Card 
      className="min-w-[160px] sm:min-w-[180px] overflow-hidden border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onPlay}
    >
      <div className={`aspect-square bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        {playlist.tracks[0]?.cover_url ? (
          <img 
            src={playlist.tracks[0].cover_url} 
            alt={playlist.title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <Music2 className="h-12 w-12 text-foreground/30" />
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          {playlist.tracks.length} треков
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{playlist.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{playlist.description}</p>
      </div>
    </Card>
  );
}

interface AutoPlaylistsSectionOptimizedProps {
  playlists: GenrePlaylist[];
  isLoading: boolean;
}

export function AutoPlaylistsSectionOptimized({ playlists, isLoading }: AutoPlaylistsSectionOptimizedProps) {
  const { setQueue } = usePlaybackQueue();
  const navigate = useNavigate();

  const handlePlayPlaylist = (playlist: GenrePlaylist) => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks as any, 0);
    toast.success(`Воспроизведение: ${playlist.title}`);
  };

  if (isLoading) {
    return (
      <Card className="p-5 sm:p-6 glass-card border-primary/20">
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[160px]">
              <div className="aspect-square bg-muted rounded-lg animate-pulse mb-2" />
              <div className="h-4 bg-muted rounded w-3/4 mb-1" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 sm:p-6 glass-card border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Подборки по жанрам
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={() => navigate('/playlists')}
        >
          Все плейлисты
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <ScrollArea className="-mx-2 px-2">
        <div className="flex gap-4 pb-2">
          {playlists.map(playlist => (
            <AutoPlaylistCard
              key={playlist.id}
              playlist={playlist}
              onPlay={() => handlePlayPlaylist(playlist)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
