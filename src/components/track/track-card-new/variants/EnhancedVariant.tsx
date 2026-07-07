/**
 * EnhancedVariant - Rich card with social features
 *
 * Features:
 * - DoubleTapLike
 * - Creator info
 * - Follow button
 * - Add to queue
 * - Share
 */

import { memo, useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Play, Pause, Share2, Music2, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useTelegram } from "@/contexts/TelegramContext";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/social/useFollow";
import { useIsMobile } from "@/hooks/use-mobile";
import { LikeButton } from "@/components/ui/like-button";
import { QuickQueueButton } from "@/components/track/QuickQueueButton";
import { CardFollowButton } from "../components/CardFollowButton";
import { DoubleTapLike } from "@/components/engagement/DoubleTapLike";
import { CreatorAvatar, CreatorLink } from "@/components/ui/creator-avatar";
import { PublicTrackDetailSheet } from "@/components/home/PublicTrackDetailSheet";
import type { EnhancedTrackCardProps } from "../types";
import type { Track } from "@/types/track";
import { pill } from "@/lib/overlay-colors";

export const EnhancedVariant = memo(function EnhancedVariant({
  track,
  onRemix,
  onShare,
  showFollowButton = true,
  compact = false,
  className,
  priority = false,
}: EnhancedTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [imageError, setImageError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnTrack = user?.id === track.user_id;
  const { isFollowing } = useFollow(track.user_id);

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.like_count ?? 0,
  } as Track;

  const handleCardClick = useCallback(() => {
    hapticFeedback("light");
    setDetailsOpen(true);
  }, [hapticFeedback]);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isCurrentTrack && isPlaying) {
        pauseTrack();
      } else {
        playTrack(trackForPlayer);
      }
    },
    [isCurrentTrack, isPlaying, pauseTrack, playTrack, trackForPlayer],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (onShare) {
        onShare(track.id);
        return;
      }

      const shareUrl = `${window.location.origin}/track/${track.id}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: track.title || "Трек",
            text: `Послушай "${track.title}" на MusicVerse`,
            url: shareUrl,
          });
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Ссылка скопирована");
          }
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Ссылка скопирована");
      }
    },
    [track.id, track.title, onShare],
  );

  // Cover URL priority
  const platformCover = track.local_cover_url?.trim() || null;
  const sunoCover = track.cover_url?.trim() || null;
  const coverUrl = imageError ? (platformCover ? sunoCover : null) : platformCover || sunoCover;

  return (
    <>
      <DoubleTapLike
        trackId={track.id}
        initialLiked={track.user_liked}
        onSingleTap={handleCardClick}
        className="h-full"
      >
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="h-full"
        >
          <Card
            className={cn(
              "group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm h-full",
              "shadow-sm hover:shadow-lg hover:ring-1 hover:ring-primary/20 transition-all duration-200 cursor-pointer",
              isCurrentTrack && "ring-2 ring-primary ring-offset-1 ring-offset-background",
              "card-waveform-hover",
              className,
            )}
            data-playing={isCurrentlyPlaying ? "true" : undefined}
          >
            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-t-lg aspect-square">
              {coverUrl ? (
                <LazyImage
                  src={coverUrl}
                  alt={track.title || "Track cover"}
                  coverSize="medium"
                  aspectRatio="1/1"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  priority={priority}
                  fallback={<Music2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" aria-hidden />}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 flex items-center justify-center">
                  <Music2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40" />
                </div>
              )}

              {/* Gradient Overlay — uses foreground tokens (no raw black) */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent",
                  "opacity-50 group-hover:opacity-70 transition-opacity duration-300",
                )}
              />

              {/* Play Button - larger touch target on mobile */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isHovered || isCurrentlyPlaying ? 1 : 0,
                  scale: isHovered || isCurrentlyPlaying ? 1 : 0.8,
                }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  size="icon"
                  className={cn(
                    "w-12 h-12 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full shadow-xl",
                    "bg-primary/90 hover:bg-primary transition-all",
                  )}
                  onClick={handlePlay}
                  disabled={!track.audio_url}
                  aria-label={isCurrentlyPlaying ? "Пауза" : "Воспроизвести"}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-6 h-6 sm:w-5 sm:h-5 text-primary-foreground" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-5 sm:h-5 text-primary-foreground ml-0.5" />
                  )}
                </Button>
              </motion.div>

              {/* Playing Indicator */}
              {isCurrentlyPlaying && (
                <div className="absolute top-2 left-2">
                  <motion.div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-overline font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="flex items-center gap-0.5 h-2.5">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-primary-foreground rounded-full"
                          animate={{ height: ["40%", "100%", "60%", "80%", "40%"] }}
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
                  className="h-7 min-w-[28px] rounded-full text-foreground"
                />
              </div>

              {/* Bottom Actions - always visible on mobile (touch), hover-reveal on desktop */}
              <motion.div
                className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5"
                initial={false}
                animate={{
                  opacity: isMobile || isHovered ? 1 : 0,
                  y: isMobile || isHovered ? 0 : 10,
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Add to Queue - 44px touch target */}
                {user && <QuickQueueButton track={trackForPlayer} size="md" variant="overlay" />}

                {/* Follow Creator */}
                <CardFollowButton userId={track.user_id} isOwnTrack={isOwnTrack} show={showFollowButton} size="md" />

                {/* Share */}
                <Button
                  size="icon"
                  variant="secondary"
                  className={cn(
                    "h-11 w-11 min-w-[44px] min-h-[44px] sm:h-7 sm:w-7 sm:min-w-0 sm:min-h-0 rounded-full border-0 ml-auto",
                    pill.glassDark,
                  )}
                  onClick={handleShare}
                  aria-label="Поделиться"
                >
                  <Share2 className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-foreground" />
                </Button>
              </motion.div>
            </div>

            {/* Content - increased padding for mobile */}
            <div className={cn("relative", compact ? "p-2.5" : "p-3 sm:p-2.5")}>
              <h3
                className={cn(
                  "font-semibold line-clamp-2 transition-colors",
                  compact ? "text-xs" : "text-sm",
                  isHovered && "text-primary",
                )}
              >
                {track.title || "Без названия"}
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
                    className="text-overline text-muted-foreground truncate max-w-32"
                  />

                  {/* Follow badge if following */}
                  {isFollowing && (
                    <span className="inline-flex items-center gap-0.5 text-overline text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                      <Check className="w-2.5 h-2.5" aria-hidden="true" />
                      Подписка
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </DoubleTapLike>

      <PublicTrackDetailSheet open={detailsOpen} onOpenChange={setDetailsOpen} track={track} />
    </>
  );
});
