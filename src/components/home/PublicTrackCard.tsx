import { useState } from 'react';
import { Play, Pause, Heart, Share2, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio';
import { useTelegram } from '@/contexts/TelegramContext';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import type { Track } from '@/hooks/useTracksOptimized';
import { motion } from '@/lib/motion';

interface PublicTrackCardProps {
  track: PublicTrackWithCreator;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PublicTrackCard({ track, onRemix, className }: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const [imageError, setImageError] = useState(false);
  
  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  // Convert to Track type for player
  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.likes_count ?? 0,
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack(trackForPlayer);
      }
    } else {
      playTrack(trackForPlayer);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    
    if (navigator.share) {
      navigator.share({
        title: track.title || 'Трек',
        text: `Послушай "${track.title}" на MusicVerse`,
        url: `${window.location.origin}/track/${track.id}`,
      });
    }
  };

  const coverUrl = imageError ? null : (track.cover_url || track.local_cover_url);

  return (
    <Card 
      className={cn(
        "group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300",
        isCurrentTrack && "ring-2 ring-primary/50",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={track.title || 'Track cover'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music2 className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <Button
            size="icon"
            className="w-14 h-14 rounded-full bg-primary/90 hover:bg-primary shadow-lg shadow-primary/30"
            onClick={handlePlay}
            disabled={!track.audio_url}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
            )}
          </Button>
        </motion.div>

        {/* Playing Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              Играет
            </div>
          </div>
        )}

        {/* Likes Count Badge */}
        {(track.likes_count || 0) > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
            <Heart className="w-3 h-3 fill-current text-red-400" />
            {track.likes_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {track.title || 'Без названия'}
          </h3>
          {track.style && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {track.style}
            </p>
          )}
        </div>

        {/* Creator Info */}
        {(track.creator_username || track.creator_photo_url) && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <Avatar className="w-5 h-5">
              {track.creator_photo_url ? (
                <AvatarImage src={track.creator_photo_url} alt={track.creator_username || ''} />
              ) : null}
              <AvatarFallback className="text-[8px] bg-muted">
                {(track.creator_username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {track.creator_username || 'Пользователь'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1.5"
            onClick={handlePlay}
            disabled={!track.audio_url}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isCurrentlyPlaying ? 'Пауза' : 'Играть'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
