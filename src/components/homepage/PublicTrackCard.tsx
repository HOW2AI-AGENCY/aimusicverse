/**
 * PublicTrackCard Component
 * Sprint 010 - Phase 3: User Story 5 (Homepage Discovery)
 * Displays a public track with play controls, like button, and share functionality
 */

import React from 'react';
import { Play, Pause, Heart, Share2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToggleTrackLike } from '@/hooks/usePublicTracks';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';

interface PublicTrack {
  id: string;
  title: string;
  style: string;
  cover_url: string | null;
  audio_url: string | null;
  likes_count: number;
  plays_count: number;
  views_count?: number;
  user_liked?: boolean;
  created_at: string;
  tags?: string[];
}

interface PublicTrackCardProps {
  track: PublicTrack;
  onPlay?: (track: PublicTrack) => void;
  onShare?: (track: PublicTrack) => void;
  className?: string;
}

/**
 * Card component for displaying public tracks on the homepage
 * Features: play/pause, like, share, view count, tags
 */
export function PublicTrackCard({ track, onPlay, onShare, className }: PublicTrackCardProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const toggleLike = useToggleTrackLike();

  const isCurrentTrack = activeTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = () => {
    if (isTrackPlaying) {
      pauseTrack();
    } else if (isCurrentTrack) {
      playTrack();
    } else if (onPlay) {
      onPlay(track);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike.mutateAsync({
      trackId: track.id,
      isLiked: track.user_liked || false,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(track);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card 
      className={cn(
        'group overflow-hidden transition-all hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-0">
        {/* Cover Image with Play Button Overlay */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={track.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl font-bold text-muted-foreground opacity-20">
                {track.title.charAt(0)}
              </span>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="lg"
              variant="default"
              className="h-16 w-16 rounded-full"
              onClick={handlePlayPause}
            >
              {isTrackPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Stats Overlay */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 text-white drop-shadow-lg">
            {track.views_count !== undefined && (
              <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs backdrop-blur-sm">
                <Eye className="h-3 w-3" />
                <span>{formatCount(track.views_count)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="p-4 space-y-3">
          {/* Title and Style */}
          <div>
            <h3 className="font-semibold text-base line-clamp-1 mb-1">
              {track.title}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {track.style}
            </Badge>
          </div>

          {/* Tags */}
          {track.tags && track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {track.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {track.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{track.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className={cn(
                  'h-4 w-4',
                  track.user_liked && 'fill-red-500 text-red-500'
                )} />
                <span>{formatCount(track.likes_count)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                <span>{formatCount(track.plays_count)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  'h-8 w-8 p-0',
                  track.user_liked && 'text-red-500 hover:text-red-600'
                )}
                onClick={handleLike}
                disabled={toggleLike.isPending}
              >
                <Heart className={cn(
                  'h-4 w-4',
                  track.user_liked && 'fill-current'
                )} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}