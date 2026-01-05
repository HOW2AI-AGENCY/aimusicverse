/**
 * QuickActionsSection - Compact horizontal quick actions (4 items only)
 * Play, Like, Queue, Share - minimal and fast
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

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  color?: 'default' | 'primary' | 'danger';
}

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

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'play',
      icon: isTrackPlaying ? Pause : Play,
      label: isTrackPlaying ? 'Пауза' : 'Играть',
      onClick: handlePlay,
      color: 'primary' as const,
    },
    {
      id: 'like',
      icon: Heart,
      label: track.is_liked ? 'Убрать' : 'Лайк',
      isActive: track.is_liked,
      onClick: handleLike,
      color: track.is_liked ? 'danger' as const : 'default' as const,
    },
    {
      id: 'queue',
      icon: ListPlus,
      label: 'В очередь',
      onClick: handleAddToQueue,
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Поделиться',
      onClick: handleShare,
    },
  ], [isTrackPlaying, track.is_liked, track.id]);

  return (
    <div className="py-2">
      <div className="flex gap-2 justify-between">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const colorClass = action.color ? colorVariants[action.color] : colorVariants.default;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className={cn(
                  "w-full gap-1.5 h-9 px-2 rounded-lg border transition-all",
                  "active:scale-95 touch-manipulation",
                  colorClass,
                  action.isActive && action.id === 'like' && "bg-red-500/20 border-red-500/40 text-red-500"
                )}
              >
                <Icon 
                  className={cn(
                    "w-4 h-4 transition-transform",
                    action.isActive && "scale-110"
                  )} 
                  fill={action.isActive && action.id === 'like' ? 'currentColor' : 'none'} 
                />
                <span className="text-[11px] font-medium">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
