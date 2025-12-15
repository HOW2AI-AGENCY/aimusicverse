import { Music2, Play, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePlaybackQueue } from '@/hooks/audio';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import { GlassCard } from '@/components/ui/glass-card';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';

const GENRE_COLORS: Record<string, string> = {
  'electronic': 'from-cyan-500/40 to-blue-500/40',
  'hip-hop': 'from-orange-500/40 to-red-500/40',
  'pop': 'from-pink-500/40 to-purple-500/40',
  'rock': 'from-red-500/40 to-orange-500/40',
  'ambient': 'from-teal-500/40 to-green-500/40',
  'jazz': 'from-amber-500/40 to-yellow-500/40',
  'rnb': 'from-violet-500/40 to-fuchsia-500/40',
  'classical': 'from-slate-500/40 to-zinc-500/40',
  'lofi': 'from-emerald-500/40 to-teal-500/40',
  'latin': 'from-rose-500/40 to-orange-500/40',
  'country': 'from-amber-600/40 to-yellow-600/40',
  'cinematic': 'from-indigo-500/40 to-purple-500/40',
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
  index: number;
}

function AutoPlaylistCard({ playlist, onPlay, index }: AutoPlaylistCardProps) {
  const gradient = GENRE_COLORS[playlist.genre] || 'from-primary/40 to-primary/20';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <GlassCard 
        className="min-w-[160px] sm:min-w-[180px] overflow-hidden cursor-pointer group p-0"
        hover="lift"
        onClick={onPlay}
      >
        <div className={`aspect-square bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}>
          {playlist.tracks[0]?.cover_url ? (
            <img 
              src={playlist.tracks[0].cover_url} 
              alt={playlist.title}
              className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <Music2 className="h-12 w-12 text-foreground/30" />
          )}
          
          {/* Hover overlay */}
          <motion.div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div 
              className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
            </motion.div>
          </motion.div>
          
          {/* Track count badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
            {playlist.tracks.length} треков
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {playlist.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{playlist.description}</p>
        </div>
      </GlassCard>
    </motion.div>
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
      <GlassCard className="p-5 sm:p-6">
        <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="min-w-[160px]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-square bg-muted/50 rounded-lg animate-pulse mb-2" />
              <div className="h-4 bg-muted/50 rounded w-3/4 mb-1 animate-pulse" />
              <div className="h-3 bg-muted/50 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </motion.div>
          <span className="text-gradient">Подборки по жанрам</span>
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground group"
          onClick={() => navigate('/playlists')}
        >
          Все плейлисты
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>

      <ScrollArea className="-mx-2 px-2">
        <div className="flex gap-4 pb-2">
          {playlists.map((playlist, index) => (
            <AutoPlaylistCard
              key={playlist.id}
              playlist={playlist}
              index={index}
              onPlay={() => handlePlayPlaylist(playlist)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </GlassCard>
  );
}
