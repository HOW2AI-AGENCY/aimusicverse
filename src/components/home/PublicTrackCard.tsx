import { useState } from 'react';
import { Play, Pause, Share2, Music2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio';
import { useTelegram } from '@/contexts/TelegramContext';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import type { Track } from '@/hooks/useTracksOptimized';
import { motion } from '@/lib/motion';
import { LikeButton } from '@/components/ui/like-button';
import { PublicTrackDetailSheet } from './PublicTrackDetailSheet';

interface PublicTrackCardProps {
  track: PublicTrackWithCreator;
  onRemix?: (trackId: string) => void;
  compact?: boolean;
  className?: string;
}

export function PublicTrackCard({ track, onRemix, compact = false, className }: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const [imageError, setImageError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  // Convert to Track type for player
  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.likes_count ?? 0,
  };

  const handleCardClick = () => {
    hapticFeedback('light');
    setDetailsOpen(true);
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

  // Priority: local_cover_url (platform-generated) > cover_url (Suno provider fallback)
  // Check for valid cover URL (not null, undefined, or empty string)
  const platformCover = track.local_cover_url && track.local_cover_url.trim() !== '' ? track.local_cover_url : null;
  const sunoCover = track.cover_url && track.cover_url.trim() !== '' ? track.cover_url : null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : (platformCover || sunoCover);

  return (
    <>
    <Card 
      className={cn(
        "group overflow-hidden border-border/50 bg-card/50 transition-all touch-manipulation cursor-pointer",
        isCurrentTrack && "ring-1 ring-primary/50",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={track.title || 'Track cover'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Gradient Overlay - Desktop only */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play Button */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <Button
            size="icon"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/90 hover:bg-primary shadow-lg"
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
      <div className={cn("p-2 sm:p-3 space-y-1.5", compact && "p-2")}>
        <div>
          <h3 className={cn(
            "font-semibold line-clamp-1 group-hover:text-primary transition-colors",
            compact ? "text-xs" : "text-sm"
          )}>
            {track.title || 'Без названия'}
          </h3>
          {track.style && !compact && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {track.style}
            </p>
          )}
        </div>

        {/* Creator Info - Hide on compact */}
        {!compact && (track.creator_name || track.creator_username || track.creator_photo_url) && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <Avatar className="w-5 h-5">
              {track.creator_photo_url ? (
                <AvatarImage src={track.creator_photo_url} alt={track.creator_name || track.creator_username || ''} />
              ) : null}
              <AvatarFallback className="text-[8px] bg-muted">
                {(track.creator_name || track.creator_username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {track.creator_name || track.creator_username || 'Пользователь'}
            </span>
          </div>
        )}

        {/* Actions - Simplified on compact */}
        {!compact && (
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
            
            <LikeButton 
              trackId={track.id} 
              likesCount={track.likes_count || 0}
              size="sm"
              showCount
              className="h-8"
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>

    <PublicTrackDetailSheet 
      open={detailsOpen} 
      onOpenChange={setDetailsOpen} 
      track={track} 
    />
    </>
  );
}
