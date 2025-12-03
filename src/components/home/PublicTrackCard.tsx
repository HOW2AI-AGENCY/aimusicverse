import { useState } from 'react';
import { Play, Pause, Heart, Share2, Copy, MoreVertical, User, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { formatDuration } from '@/lib/player-utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

interface PublicTrackCardProps {
  track: PublicTrackWithCreator;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PublicTrackCard({
  track,
  onRemix,
  className,
}: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const [isLiked, setIsLiked] = useState(false);
  const isCurrentTrack = activeTrack?.id === track.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  // Display name: use creator username or fallback
  const creatorName = track.creator_username || 'Аноним';
  const creatorAvatar = track.creator_photo_url;
  
  // Only show artist if actually used (artist_name is set)
  const hasArtist = !!track.artist_name;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisTrackPlaying) {
      pauseTrack();
    } else {
      playTrack(track as any);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
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
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg',
        'cursor-pointer',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={track.cover_url || '/placeholder-cover.jpg'}
          alt={track.title || 'Track'}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full"
            onClick={handlePlayPause}
          >
            {isThisTrackPlaying ? (
              <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Track Type Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {track.is_instrumental && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              Instrumental
            </Badge>
          )}
          {hasArtist && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm">
              <Users className="w-2.5 h-2.5 mr-1" />
              {track.artist_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title and Creator */}
        <div className="space-y-1">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {track.title || 'Без названия'}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
              <AvatarImage src={creatorAvatar} />
              <AvatarFallback className="text-[8px] sm:text-xs bg-primary/10">
                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </AvatarFallback>
            </Avatar>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              @{creatorName}
            </p>
          </div>
        </div>

        {/* Duration and Stats */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          <span>{formatDuration(track.duration_seconds || 0)}</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {track.play_count || 0}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              0
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'flex-1 h-7 sm:h-8 text-xs',
              isLiked && 'text-red-500 hover:text-red-600'
            )}
            onClick={handleLike}
          >
            <Heart className={cn('h-3 w-3 sm:h-4 sm:w-4 mr-1', isLiked && 'fill-current')} />
            <span className="hidden sm:inline">Like</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 sm:h-8 px-2"
            onClick={handleShare}
          >
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {onRemix && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 sm:h-8 px-2"
              onClick={handleRemix}
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 sm:h-8 px-2"
          >
            <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}