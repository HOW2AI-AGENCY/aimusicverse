import { useState } from 'react';
import { Play, Pause, Heart, Share2, Copy, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { formatDuration } from '@/lib/player-utils';
import type { Database } from '@/integrations/supabase/types';

type TrackRow = Database['public']['Tables']['tracks']['Row'];

interface PublicTrackCardProps {
  track: TrackRow;
  artistName?: string;
  artistAvatar?: string;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PublicTrackCard({
  track,
  artistName = 'Unknown Artist',
  artistAvatar,
  onRemix,
  className,
}: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const [isLiked, setIsLiked] = useState(false);
  const isCurrentTrack = activeTrack?.id === track.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisTrackPlaying) {
      pauseTrack();
    } else {
      // Cast to Track type for player compatibility
      playTrack(track as any);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    // TODO: Implement like functionality with Supabase
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    navigator.share?.({
      title: track.title || 'Track',
      text: `Check out "${track.title}" by ${artistName}`,
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
            className="h-14 w-14 rounded-full"
            onClick={handlePlayPause}
          >
            {isThisTrackPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Track Type Badge */}
        {track.has_vocals === false && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-xs"
          >
            Instrumental
          </Badge>
        )}
      </div>

      {/* Track Info */}
      <div className="p-4 space-y-3">
        {/* Title and Artist */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {track.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={artistAvatar} />
              <AvatarFallback className="text-xs">
                {artistName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate">
              {artistName}
            </p>
          </div>
        </div>

        {/* Duration and Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDuration(track.duration_seconds || 0)}</span>
          <div className="flex items-center gap-3">
            {/* Play count */}
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {track.play_count || 0}
            </span>
            {/* Like count - TODO: Add from database */}
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              0
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'flex-1 h-8',
              isLiked && 'text-red-500 hover:text-red-600'
            )}
            onClick={handleLike}
          >
            <Heart className={cn('h-4 w-4 mr-1', isLiked && 'fill-current')} />
            Like
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {onRemix && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={handleRemix}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}