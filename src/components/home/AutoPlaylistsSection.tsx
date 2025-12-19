import { Music2, Play, ChevronRight, Disc3, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { usePlaybackQueue } from '@/hooks/audio';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

const GENRE_COLORS: Record<string, { gradient: string; accent: string }> = {
  'electronic': { gradient: 'from-cyan-500/30 via-blue-500/20 to-indigo-500/30', accent: 'text-cyan-400' },
  'hip-hop': { gradient: 'from-orange-500/30 via-red-500/20 to-rose-500/30', accent: 'text-orange-400' },
  'pop': { gradient: 'from-pink-500/30 via-purple-500/20 to-violet-500/30', accent: 'text-pink-400' },
  'rock': { gradient: 'from-red-500/30 via-orange-500/20 to-amber-500/30', accent: 'text-red-400' },
  'ambient': { gradient: 'from-teal-500/30 via-green-500/20 to-emerald-500/30', accent: 'text-teal-400' },
  'jazz': { gradient: 'from-amber-500/30 via-yellow-500/20 to-orange-500/30', accent: 'text-amber-400' },
  'rnb': { gradient: 'from-violet-500/30 via-fuchsia-500/20 to-pink-500/30', accent: 'text-violet-400' },
  'classical': { gradient: 'from-slate-500/30 via-zinc-500/20 to-gray-500/30', accent: 'text-slate-400' },
  'lofi': { gradient: 'from-emerald-500/30 via-teal-500/20 to-cyan-500/30', accent: 'text-emerald-400' },
  'latin': { gradient: 'from-rose-500/30 via-orange-500/20 to-amber-500/30', accent: 'text-rose-400' },
  'country': { gradient: 'from-amber-600/30 via-yellow-600/20 to-orange-600/30', accent: 'text-amber-500' },
  'cinematic': { gradient: 'from-indigo-500/30 via-purple-500/20 to-violet-500/30', accent: 'text-indigo-400' },
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
  const colors = GENRE_COLORS[playlist.genre] || { gradient: 'from-primary/30 to-primary/10', accent: 'text-primary' };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <div 
        className={cn(
          "relative w-[150px] sm:w-[170px] overflow-hidden cursor-pointer rounded-2xl",
          "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
          "border border-border/50 hover:border-primary/40",
          "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
        )}
        onClick={onPlay}
      >
        {/* Cover with gradient overlay */}
        <div className={cn(
          "aspect-square relative overflow-hidden",
          `bg-gradient-to-br ${colors.gradient}`
        )}>
          {/* Cover images grid */}
          {playlist.tracks.length > 0 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1">
              {playlist.tracks.slice(0, 4).map((track, i) => (
                <div key={track.id} className="relative overflow-hidden rounded-lg">
                  {track.cover_url ? (
                    <img 
                      src={track.cover_url} 
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center",
                      `bg-gradient-to-br ${colors.gradient}`
                    )}>
                      <Music2 className={cn("w-6 h-6 opacity-40", colors.accent)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Disc3 className={cn("w-16 h-16 opacity-30", colors.accent)} />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Play button overlay */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <motion.div 
              className="w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
            </motion.div>
          </motion.div>
          
          {/* Genre badge */}
          <div className="absolute top-2 left-2">
            <Badge className={cn(
              "text-[10px] px-2 py-0.5 font-semibold shadow-lg border-none",
              "bg-black/60 backdrop-blur-sm text-white"
            )}>
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {playlist.genre}
            </Badge>
          </div>
          
          {/* Track count badge */}
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-none text-[10px] px-2 py-0.5 font-semibold shadow-lg">
              <Headphones className="w-2.5 h-2.5 mr-1" />
              {playlist.tracks.length}
            </Badge>
          </div>
        </div>
        
        {/* Info section */}
        <div className="p-3 space-y-1">
          <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
            {playlist.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {playlist.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface AutoPlaylistsSectionProps {
  playlists: GenrePlaylist[];
  isLoading: boolean;
}

export function AutoPlaylistsSection({ playlists, isLoading }: AutoPlaylistsSectionProps) {
  const { setQueue } = usePlaybackQueue();
  const navigate = useNavigate();

  const handlePlayPlaylist = (playlist: GenrePlaylist) => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks as any, 0);
    toast.success(`Воспроизведение: ${playlist.title}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-28 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="w-[150px] rounded-2xl overflow-hidden shrink-0"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-square bg-muted/30 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted/30 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted/30 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Disc3 className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gradient">
              Подборки по жанрам
            </h2>
            <p className="text-xs text-muted-foreground">
              Автоматические плейлисты
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl"
          onClick={() => navigate('/playlists')}
        >
          Все
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Playlists scroll */}
      <div className="relative -mx-3 sm:mx-0">
        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
        
        <ScrollArea className="px-3 sm:px-0">
          <div className="flex gap-3 pb-3">
            {playlists.map((playlist, index) => (
              <AutoPlaylistCard
                key={playlist.id}
                playlist={playlist}
                index={index}
                onPlay={() => handlePlayPlaylist(playlist)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>
    </div>
  );
}
