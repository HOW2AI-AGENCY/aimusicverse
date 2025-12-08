import { useState } from 'react';
import { Play, Pause, Heart, Share2, Copy, MoreVertical, User, Users, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { formatDuration } from '@/lib/player-utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';
import { logger } from '@/lib/logger';

interface PublicTrackCardProps {
  track: PublicTrackWithCreator;
  onRemix?: (trackId: string) => void;
  className?: string;
  index?: number;
}

export function PublicTrackCard({
  track,
  onRemix,
  className,
  index = 0,
}: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(track.user_liked || false);
  const [likeCount, setLikeCount] = useState(track.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isCurrentTrack = activeTrack?.id === track.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  const creatorName = track.creator_username || 'Аноним';
  const creatorAvatar = track.creator_photo_url;
  const hasArtist = !!track.artist_name;

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisTrackPlaying) {
      pauseTrack();
    } else {
      try {
        await supabase.rpc('increment_track_play_count', { track_id_param: track.id });
      } catch (err) {
        logger.error('Failed to increment play count', { error: err });
      }
      playTrack(track as any);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    
    setIsLiking(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Войдите, чтобы ставить лайки');
      setIsLiking(false);
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('track_likes')
          .delete()
          .eq('track_id', track.id)
          .eq('user_id', user.id);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('track_likes')
          .insert({ track_id: track.id, user_id: user.id });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
      queryClient.invalidateQueries({ queryKey: ['public-content'] });
    } catch (error) {
      logger.error('Like error', { error });
      toast.error('Ошибка при обновлении лайка');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.share?.({
      title: track.title || 'Track',
      text: `Послушай "${track.title}" от @${creatorName}`,
      url: window.location.href,
    });
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemix?.(track.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <GlassCard
        hover="lift"
        className={cn(
          'group relative overflow-hidden cursor-pointer',
          isCurrentTrack && 'ring-2 ring-primary/50',
          className
        )}
        padding="none"
      >
        {/* Cover Image with Gradient Overlay */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {/* Shimmer Loading State */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse">
              <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          
          <img
            src={track.cover_url || '/placeholder-cover.jpg'}
            alt={track.title || 'Track'}
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              "group-hover:scale-110",
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Playing Indicator */}
          {isThisTrackPlaying && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
                <span className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-white rounded-full"
                      animate={{ height: [4, 12, 4] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full shadow-2xl",
                  "bg-primary hover:bg-primary/90",
                  "glow-button"
                )}
                onClick={handlePlayPause}
              >
                {isThisTrackPlaying ? (
                  <Pause className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {track.is_instrumental && (
                  <Badge variant="glass" className="text-[10px] px-1.5 py-0.5">
                    🎸
                  </Badge>
                )}
                {hasArtist && (
                  <Badge variant="glass" className="text-[10px] px-1.5 py-0.5">
                    <Users className="w-2.5 h-2.5 mr-1" />
                    {track.artist_name}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-white/80 font-medium">
                {formatDuration(track.duration_seconds || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {track.title || 'Без названия'}
          </h3>
          
          {/* Creator Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5 ring-1 ring-border">
                <AvatarImage src={creatorAvatar} />
                <AvatarFallback className="text-[8px] bg-primary/10">
                  <User className="h-2.5 w-2.5" />
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate max-w-[80px]">
                @{creatorName}
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Play className="h-2.5 w-2.5" />
                {track.play_count || 0}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart className={cn("h-2.5 w-2.5", isLiked && "fill-red-500 text-red-500")} />
                {likeCount}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pt-1">
            <Button
              size="sm"
              variant={isLiked ? "default" : "ghost"}
              className={cn(
                'flex-1 h-8 text-xs transition-all',
                isLiked && 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={cn('h-3.5 w-3.5 mr-1', isLiked && 'fill-current')} />
              Like
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            {onRemix && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5"
                onClick={handleRemix}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
