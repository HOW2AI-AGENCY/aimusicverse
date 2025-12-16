import { useState } from 'react';
import { Play, Pause, Share2, Music2, Heart, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio';
import { useTelegram } from '@/contexts/TelegramContext';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import type { Track } from '@/hooks/useTracksOptimized';
import { motion } from '@/lib/motion';
import { LikeButton } from '@/components/ui/like-button';
import { PublicTrackDetailSheet } from './PublicTrackDetailSheet';
import { CreatorAvatar, CreatorLink } from '@/components/ui/creator-avatar';

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
  const [isHovered, setIsHovered] = useState(false);
  
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
  const platformCover = track.local_cover_url && track.local_cover_url.trim() !== '' ? track.local_cover_url : null;
  const sunoCover = track.cover_url && track.cover_url.trim() !== '' ? track.cover_url : null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : (platformCover || sunoCover);

  return (
    <>
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
          "shadow-md transition-all duration-300 cursor-pointer",
          isCurrentTrack && "ring-2 ring-primary ring-offset-1 ring-offset-background",
          isHovered && "shadow-lg shadow-primary/10",
          className
        )}
        onClick={handleCardClick}
      >
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {coverUrl ? (
            <motion.img
              src={coverUrl}
              alt={track.title || 'Track cover'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 flex items-center justify-center">
              <Music2 className="w-8 h-8 text-primary/40" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent",
            "opacity-50 group-hover:opacity-70 transition-opacity duration-300"
          )} />
          
          {/* Play Button */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered || isCurrentlyPlaying ? 1 : 0,
              scale: isHovered || isCurrentlyPlaying ? 1 : 0.8 
            }}
            transition={{ duration: 0.15 }}
          >
            <Button
              size="icon"
              className={cn(
                "w-11 h-11 rounded-full shadow-xl",
                "bg-primary/90 hover:bg-primary transition-all",
                isCurrentlyPlaying && "bg-primary"
              )}
              onClick={handlePlay}
              disabled={!track.audio_url}
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </Button>
          </motion.div>

          {/* Playing Indicator */}
          {isCurrentlyPlaying && (
            <div className="absolute top-2 left-2">
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center gap-0.5 h-2.5">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      className="w-0.5 bg-primary-foreground rounded-full"
                      animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Stats - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {(track.likes_count || 0) > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px]">
                <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" />
                <span className="font-medium">{track.likes_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={cn("relative p-2.5", compact && "p-2")}>
          <h3 className={cn(
            "font-semibold line-clamp-1 transition-colors",
            compact ? "text-xs" : "text-sm",
            isHovered && "text-primary"
          )}>
            {track.title || 'Без названия'}
          </h3>

          {/* Creator Info - Compact */}
          {!compact && (track.creator_name || track.creator_username) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <CreatorAvatar
                userId={track.user_id}
                photoUrl={track.creator_photo_url}
                name={track.creator_name}
                username={track.creator_username}
                size="xs"
              />
              <CreatorLink
                userId={track.user_id}
                name={track.creator_name}
                username={track.creator_username}
                className="text-xs text-muted-foreground truncate"
              />
            </div>
          )}

          {/* Actions - Compact */}
          {!compact && (
            <div className="flex items-center gap-1.5 mt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={handlePlay}
                disabled={!track.audio_url}
              >
                {isCurrentlyPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isCurrentlyPlaying ? 'Пауза' : 'Играть'}
              </Button>
              
              <LikeButton 
                trackId={track.id} 
                likesCount={track.likes_count || 0}
                size="sm"
                showCount={false}
                className="h-8 w-8"
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
    </motion.div>

    <PublicTrackDetailSheet 
      open={detailsOpen} 
      onOpenChange={setDetailsOpen} 
      track={track} 
    />
    </>
  );
}