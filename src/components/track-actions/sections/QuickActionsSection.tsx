/**
 * QuickActionsSection - Compact icon-only quick actions
 * Play, Like, Queue, Share - minimal, icons only
 */

import { memo, useMemo } from 'react';
import { Play, Pause, Heart, Share2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTracks } from '@/hooks/useTracks';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface QuickActionsSectionProps {
  track: Track;
  onClose: () => void;
  onDownload?: () => void;
}

const colorVariants = {
  default: 'bg-muted hover:bg-muted/80 text-foreground',
  primary: 'bg-primary/15 hover:bg-primary/25 text-primary',
  danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-500',
};

export const QuickActionsSection = memo(function QuickActionsSection({ 
  track, 
  onClose,
}: QuickActionsSectionProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack, addToQueue } = usePlayerStore();
  const { toggleLike } = useTracks();

  const isCurrentTrack = activeTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    hapticImpact('light');
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack();
      }
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
        await navigator.share({
          title: track.title || 'Track',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована');
      }
    } catch (err) {
      // User cancelled share
    }
  };

  const handleAddToQueue = () => {
    hapticImpact('light');
    addToQueue(track);
    toast.success('Добавлено в очередь');
  };

  const quickActions = useMemo(() => [
    {
      id: 'play',
      icon: isTrackPlaying ? Pause : Play,
      onClick: handlePlay,
      color: 'primary' as const,
      isActive: false,
    },
    {
      id: 'like',
      icon: Heart,
      isActive: track.is_liked,
      onClick: handleLike,
      color: track.is_liked ? 'danger' as const : 'default' as const,
    },
    {
      id: 'queue',
      icon: ListPlus,
      onClick: handleAddToQueue,
      color: 'default' as const,
      isActive: false,
    },
    {
      id: 'share',
      icon: Share2,
      onClick: handleShare,
      color: 'default' as const,
      isActive: false,
    },
  ], [isTrackPlaying, track.is_liked, track.id]);

  return (
    <div className="py-2">
      <div className="flex gap-3 justify-center">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const colorClass = action.color ? colorVariants[action.color] : colorVariants.default;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={action.onClick}
                className={cn(
                  "w-12 h-12 rounded-xl border transition-all",
                  "active:scale-95 touch-manipulation",
                  colorClass,
                  action.isActive && action.id === 'like' && "bg-red-500/20 border-red-500/40 text-red-500"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform",
                    action.isActive && "scale-110"
                  )} 
                  fill={action.isActive && action.id === 'like' ? 'currentColor' : 'none'} 
                />
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
