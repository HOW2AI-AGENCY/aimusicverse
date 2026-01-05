/**
 * CompactSheetHeader - Ultra-compact header with cover, title and quick actions in single row
 * Minimizes vertical space usage for better scrolling
 */

import { memo } from 'react';
import { Track } from '@/types/track';
import { Play, Pause, Heart, Share2, ListPlus, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTracks } from '@/hooks/useTracks';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface CompactSheetHeaderProps {
  track: Track;
  versions?: Array<{ id: string; label: string }>;
  activeVersionId?: string | null;
  onVersionSwitch?: (versionId: string) => void;
  onClose: () => void;
}

export const CompactSheetHeader = memo(function CompactSheetHeader({
  track,
  versions = [],
  activeVersionId,
  onVersionSwitch,
  onClose,
}: CompactSheetHeaderProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack, addToQueue } = usePlayerStore();
  const { toggleLike } = useTracks();

  const coverUrl = track.cover_url;
  const duration = track.duration_seconds ? formatDuration(track.duration_seconds) : null;
  const hasHD = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';

  const isCurrentTrack = activeTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const hasVersions = versions.length > 1;

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

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Cover - 48x48 compact size */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-12 h-12 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "ring-1 ring-white/10"
        )}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={track.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary/60" />
            </div>
          )}
        </div>
        
        {/* HD Badge */}
        {hasHD && (
          <Badge 
            className="absolute -top-1 -right-1 px-1 py-0 text-[7px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 py-0 rounded text-center min-w-[24px]">
            {duration}
          </div>
        )}
      </div>

      {/* Title + Versions */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate leading-tight">
          {track.title || 'Без названия'}
        </h3>
        
        {/* Version pills - compact inline */}
        {hasVersions && onVersionSwitch && (
          <div className="flex gap-1 mt-1">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => onVersionSwitch(version.id)}
                className={cn(
                  "h-5 min-w-[20px] px-1.5 rounded text-[10px] font-semibold",
                  "transition-all active:scale-95",
                  version.id === activeVersionId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {version.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions - compact icons */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={handlePlay}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "bg-primary/15 text-primary",
            "active:scale-95 transition-transform"
          )}
        >
          {isTrackPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <button
          onClick={handleLike}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "active:scale-95 transition-transform",
            track.is_liked 
              ? "bg-red-500/15 text-red-500" 
              : "bg-muted/60 text-muted-foreground"
          )}
        >
          <Heart 
            className="w-4 h-4" 
            fill={track.is_liked ? 'currentColor' : 'none'} 
          />
        </button>

        <button
          onClick={handleAddToQueue}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "bg-muted/60 text-muted-foreground",
            "active:scale-95 transition-transform"
          )}
        >
          <ListPlus className="w-4 h-4" />
        </button>

        <button
          onClick={handleShare}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "bg-muted/60 text-muted-foreground",
            "active:scale-95 transition-transform"
          )}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
