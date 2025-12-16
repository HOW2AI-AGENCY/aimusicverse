/**
 * Album card for displaying published projects
 */
import { Badge } from '@/components/ui/badge';
import { Music, Play, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface AlbumCardProps {
  album: {
    id: string;
    title: string;
    cover_url: string | null;
    genre: string | null;
    total_tracks_count: number | null;
    profiles?: {
      username: string | null;
      display_name: string | null;
      photo_url: string | null;
    };
  };
  onClick: () => void;
  className?: string;
}

export function AlbumCard({ album, onClick, className }: AlbumCardProps) {
  const creatorName = album.profiles?.display_name || album.profiles?.username || 'Автор';
  const trackCount = album.total_tracks_count || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-40 shrink-0 cursor-pointer group",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2 shadow-lg">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Music className="w-10 h-10 text-primary/40" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Track count badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 text-[10px] h-5 bg-black/60 text-white border-0"
        >
          {trackCount} {trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-0.5 px-0.5">
        <h3 className="font-medium text-sm truncate">{album.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {album.profiles?.photo_url ? (
            <img 
              src={album.profiles.photo_url} 
              alt={creatorName}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <User className="w-3 h-3" />
          )}
          <span className="truncate">{creatorName}</span>
        </div>
        {album.genre && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 mt-1">
            {album.genre}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
