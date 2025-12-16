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
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
          "shadow-lg shadow-black/5 transition-all duration-300 cursor-pointer",
          isCurrentTrack && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isHovered && "shadow-xl shadow-primary/10",
          className
        )}
        onClick={handleCardClick}
      >
        {/* Animated gradient border */}
        <div className={cn(
          "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500",
          isHovered && "opacity-100"
        )}>
          <div className="absolute inset-[1px] rounded-lg bg-card" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 animate-pulse" />
        </div>

        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {coverUrl ? (
            <motion.img
              src={coverUrl}
              alt={track.title || 'Track cover'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 flex items-center justify-center">
              <Music2 className="w-12 h-12 text-primary/40" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
            "opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          )} />
          
          {/* Play Button - Central */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered || isCurrentlyPlaying ? 1 : 0,
              scale: isHovered || isCurrentlyPlaying ? 1 : 0.8 
            }}
            transition={{ duration: 0.2 }}
          >
            <Button
              size="icon"
              className={cn(
                "w-14 h-14 rounded-full shadow-2xl",
                "bg-primary/90 hover:bg-primary hover:scale-110 transition-all",
                isCurrentlyPlaying && "bg-primary animate-pulse"
              )}
              onClick={handlePlay}
              disabled={!track.audio_url}
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-7 h-7 text-primary-foreground" />
              ) : (
                <Play className="w-7 h-7 text-primary-foreground ml-1" />
              )}
            </Button>
          </motion.div>

          {/* Playing Indicator with Equalizer */}
          {isCurrentlyPlaying && (
            <div className="absolute top-3 left-3">
              <motion.div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <div className="flex items-center gap-0.5 h-3">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      className="w-0.5 bg-primary-foreground rounded-full"
                      animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity,
                        delay: i * 0.1 
                      }}
                    />
                  ))}
                </div>
                <span>Играет</span>
              </motion.div>
            </div>
          )}

          {/* Stats Badges - Top Right */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {(track.likes_count || 0) > 0 && (
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                <span className="font-medium">{track.likes_count}</span>
              </motion.div>
            )}
            {(track.play_count || 0) > 0 && (
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Headphones className="w-3 h-3" />
                <span className="font-medium">{track.play_count}</span>
              </motion.div>
            )}
          </div>

          {/* Style Badge - Bottom Left */}
          {track.style && !compact && (
            <div className="absolute bottom-3 left-3">
              <Badge 
                variant="secondary" 
                className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {track.style.length > 20 ? track.style.slice(0, 20) + '...' : track.style}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn("relative p-3 sm:p-4 space-y-2", compact && "p-2")}>
          <div>
            <h3 className={cn(
              "font-bold line-clamp-1 transition-colors",
              compact ? "text-sm" : "text-base",
              isHovered && "text-primary"
            )}>
              {track.title || 'Без названия'}
            </h3>
          </div>

          {/* Creator Info */}
          {!compact && (track.creator_name || track.creator_username || track.creator_photo_url) && (
            <div className="flex items-center gap-2 py-2 border-t border-border/50">
              <CreatorAvatar
                userId={track.user_id}
                photoUrl={track.creator_photo_url}
                name={track.creator_name}
                username={track.creator_username}
                size="sm"
                className="ring-2 ring-background"
              />
              <div className="flex-1 min-w-0">
                <CreatorLink
                  userId={track.user_id}
                  name={track.creator_name}
                  username={track.creator_username}
                  className="text-sm font-medium truncate"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {!compact && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-9 gap-1.5 font-medium"
                onClick={handlePlay}
                disabled={!track.audio_url}
              >
                {isCurrentlyPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Играть
                  </>
                )}
              </Button>
              
              <LikeButton 
                trackId={track.id} 
                likesCount={track.likes_count || 0}
                size="sm"
                showCount={false}
                className="h-9 w-9"
              />
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
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