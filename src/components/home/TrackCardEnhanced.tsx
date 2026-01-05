import { useState, memo } from 'react';
import { Play, Pause, Share2, Music2, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/social/useFollow';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import type { Track } from '@/types/track';
import { motion } from '@/lib/motion';
import { LikeButton } from '@/components/ui/like-button';
import { PublicTrackDetailSheet } from './PublicTrackDetailSheet';
import { CreatorAvatar, CreatorLink } from '@/components/ui/creator-avatar';
import { DoubleTapLike } from '@/components/engagement/DoubleTapLike';
import { AddToPlaylistSheet } from './AddToPlaylistSheet';

interface TrackCardEnhancedProps {
  track: PublicTrackWithCreator;
  onRemix?: (trackId: string) => void;
  className?: string;
  showFollowButton?: boolean;
}

export const TrackCardEnhanced = memo(function TrackCardEnhanced({
  track,
  onRemix,
  className,
  showFollowButton = true,
}: TrackCardEnhancedProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnTrack = user?.id === track.user_id;
  // Note: We don't have batch-loaded follow status yet, so useFollow will still query individually
  // This will be optimized in a future enhancement when we add creator_following to the batch data
  const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useFollow(track.user_id);

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.like_count ?? 0,
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

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    setPlaylistSheetOpen(true);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    toggleFollow();
  };

  const platformCover = track.local_cover_url && track.local_cover_url.trim() !== '' ? track.local_cover_url : null;
  const sunoCover = track.cover_url && track.cover_url.trim() !== '' ? track.cover_url : null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : (platformCover || sunoCover);

  return (
    <>
      <DoubleTapLike 
        trackId={track.id} 
        initialLiked={track.user_liked}
        onSingleTap={handleCardClick}
        className="h-full"
      >
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="h-full"
        >
          <Card 
            className={cn(
              "group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm h-full",
              "shadow-md transition-all duration-300 cursor-pointer",
              isCurrentTrack && "ring-2 ring-primary ring-offset-1 ring-offset-background",
              isHovered && "shadow-lg shadow-primary/10",
              className
            )}
          >
            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-t-lg aspect-square">
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
                    "w-10 h-10 rounded-full shadow-xl",
                    "bg-primary/90 hover:bg-primary transition-all"
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

              {/* Top Right Actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <LikeButton
                  trackId={track.id}
                  likesCount={track.like_count || 0}
                  initialLiked={track.user_liked}
                  size="sm"
                  variant="glass"
                  showCount={(track.like_count || 0) > 0}
                  className="h-7 min-w-[28px] rounded-full text-white"
                />
              </div>

              {/* Bottom Actions on Hover */}
              <motion.div
                className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  y: isHovered ? 0 : 10 
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Add to Playlist */}
                {user && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 border-0"
                    onClick={handleAddToPlaylist}
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </Button>
                )}

                {/* Follow Creator */}
                {user && showFollowButton && !isOwnTrack && !isFollowing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 border-0"
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                  </Button>
                )}

                {/* Share */}
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 border-0 ml-auto"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5 text-white" />
                </Button>
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative p-2.5">
              <h3 className={cn(
                "font-semibold text-xs line-clamp-1 transition-colors",
                isHovered && "text-primary"
              )}>
                {track.title || 'Без названия'}
              </h3>

              {/* Creator Info */}
              {(track.creator_name || track.creator_username) && (
                <div className="flex items-center gap-1.5 mt-1">
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
                    className="text-[10px] text-muted-foreground truncate max-w-[80px]"
                  />
                  
                  {/* Follow badge if following */}
                  {isFollowing && (
                    <span className="text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                      ✓
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </DoubleTapLike>

      <PublicTrackDetailSheet
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        track={track} 
      />

      <AddToPlaylistSheet
        open={playlistSheetOpen}
        onOpenChange={setPlaylistSheetOpen}
        trackId={track.id}
        trackTitle={track.title || undefined}
      />
    </>
  );
});
