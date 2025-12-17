/**
 * Album card for displaying published projects
 */
import { Badge } from '@/components/ui/badge';
import { Music, Play, User, Disc3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AlbumCardProps {
  album: {
    id: string;
    title: string;
    cover_url: string | null;
    genre: string | null;
    mood: string | null;
    total_tracks_count: number | null;
    published_at?: string | null;
    profiles?: {
      username: string | null;
      display_name: string | null;
      photo_url: string | null;
    };
  };
  onClick: () => void;
  className?: string;
  isNew?: boolean;
}

export function AlbumCard({ album, onClick, className, isNew }: AlbumCardProps) {
  const creatorName = album.profiles?.display_name || album.profiles?.username || 'Автор';
  const trackCount = album.total_tracks_count || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-[150px] sm:w-[170px] shrink-0 cursor-pointer group",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary mb-3 shadow-lg group-hover:shadow-xl transition-all">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-primary/10 to-pink-500/10">
            <Disc3 className="w-12 h-12 text-purple-500/40" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <motion.div 
            className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl"
            initial={{ scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
          </motion.div>
        </div>

        {/* New badge */}
        {isNew && (
          <Badge 
            className="absolute top-2 left-2 text-[10px] h-5 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white border-0 gap-1 shadow-lg"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Новый
          </Badge>
        )}

        {/* Track count badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 text-[10px] h-5 bg-black/70 backdrop-blur-sm text-white border-0 gap-1"
        >
          <Music className="w-2.5 h-2.5" />
          {trackCount} {trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}
        </Badge>

        {/* Mood badge if available */}
        {album.mood && (
          <Badge 
            variant="outline" 
            className="absolute bottom-2 left-2 text-[10px] h-5 bg-black/50 backdrop-blur-sm text-white/90 border-white/20"
          >
            {album.mood}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-1">
        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {album.title}
        </h3>
        
        {/* Creator */}
        <div className="flex items-center gap-2">
          {album.profiles?.photo_url ? (
            <img 
              src={album.profiles.photo_url} 
              alt={creatorName}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate">{creatorName}</span>
        </div>

        {/* Genre & date */}
        <div className="flex items-center gap-2">
          {album.genre && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              {album.genre}
            </Badge>
          )}
          {album.published_at && (
            <span className="text-[10px] text-muted-foreground/70">
              {format(new Date(album.published_at), 'd MMM', { locale: ru })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
