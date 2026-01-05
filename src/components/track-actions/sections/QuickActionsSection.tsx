/**
 * QuickActionsSection - Ultra compact icon-only quick actions with inline versions
 * Play, Like, Queue, Share + Version badges
 */

import { memo, useMemo } from 'react';
import { Play, Pause, Heart, Share2, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTracks } from '@/hooks/useTracks';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface QuickActionsSectionProps {
  track: Track;
  onClose: () => void;
  versions?: Array<{ id: string; label: string }>;
  activeVersionId?: string | null;
  onVersionSwitch?: (versionId: string) => void;
}

export const QuickActionsSection = memo(function QuickActionsSection({ 
  track, 
  onClose,
  versions = [],
  activeVersionId,
  onVersionSwitch,
}: QuickActionsSectionProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack, addToQueue } = usePlayerStore();
  const { toggleLike } = useTracks();

  const isCurrentTrack = activeTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    hapticImpact('light');
    if (isCurrentTrack) {
      isPlaying ? pauseTrack() : playTrack();
    } else {
      playTrack(track);
    }
  };

  const handleLike = async () => {
    hapticImpact('light');
    await toggleLike({
      trackId: track.id,
      isLiked: track.is_liked || false,
    });
  };

  const handleShare = async () => {
    hapticImpact('light');
    const url = `${window.location.origin}/track/${track.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: track.title || 'Track', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована');
      }
    } catch { /* User cancelled */ }
  };

  const handleAddToQueue = () => {
    hapticImpact('light');
    addToQueue(track);
    toast.success('Добавлено в очередь');
  };

  const hasVersions = versions.length > 1;

  return (
    <div className="flex items-center justify-between py-1.5">
      {/* Quick action buttons */}
      <div className="flex gap-2">
        {/* Play */}
        <button
          onClick={handlePlay}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "bg-primary/15 text-primary",
            "active:scale-95 transition-transform touch-manipulation"
          )}
        >
          {isTrackPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "active:scale-95 transition-transform touch-manipulation",
            track.is_liked 
              ? "bg-red-500/15 text-red-500" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Heart 
            className="w-5 h-5" 
            fill={track.is_liked ? 'currentColor' : 'none'} 
          />
        </button>

        {/* Queue */}
        <button
          onClick={handleAddToQueue}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "bg-muted text-muted-foreground",
            "active:scale-95 transition-transform touch-manipulation"
          )}
        >
          <ListPlus className="w-5 h-5" />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            "bg-muted text-muted-foreground",
            "active:scale-95 transition-transform touch-manipulation"
          )}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Version badges - inline right */}
      {hasVersions && onVersionSwitch && (
        <div className="flex gap-1">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => onVersionSwitch(version.id)}
              className={cn(
                'min-w-7 h-7 px-2 rounded-md text-xs font-semibold',
                'transition-all active:scale-95 touch-manipulation',
                version.id === activeVersionId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {version.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
