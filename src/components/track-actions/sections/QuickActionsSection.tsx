/**
 * QuickActionsSection - Horizontal scrollable quick actions for track sheet
 * Shows most frequently used actions in compact, beautiful pill-style form
 */

import { memo, useMemo } from 'react';
import { Play, Pause, Heart, Share2, Download, Link, ListPlus, Layers, Plus, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTracks } from '@/hooks/useTracks';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  activeIcon?: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface QuickActionsSectionProps {
  track: Track;
  onClose: () => void;
  onDownload?: () => void;
}

const colorVariants = {
  default: 'bg-muted hover:bg-muted/80 text-foreground',
  primary: 'bg-primary/15 hover:bg-primary/25 text-primary border-primary/30',
  success: 'bg-green-500/15 hover:bg-green-500/25 text-green-600 border-green-500/30',
  warning: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-amber-500/30',
  danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-500 border-red-500/30',
};

export const QuickActionsSection = memo(function QuickActionsSection({ 
  track, 
  onClose,
  onDownload 
}: QuickActionsSectionProps) {
  const navigate = useNavigate();
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

  const handleAddToPlaylist = () => {
    hapticImpact('light');
    onClose();
    // Navigate to playlist selector or open dialog
    toast.info('Выберите плейлист');
  };

  const handleDownload = () => {
    hapticImpact('light');
    if (onDownload) {
      onDownload();
    } else if (track.audio_url) {
      const link = document.createElement('a');
      link.href = track.audio_url;
      link.download = `${track.title || 'track'}.mp3`;
      link.click();
      toast.success('Загрузка началась');
    }
  };

  const handleOpenStudio = () => {
    hapticImpact('medium');
    onClose();
    navigate(`/studio?trackId=${track.id}`);
  };

  const handleExtend = () => {
    hapticImpact('medium');
    onClose();
    navigate(`/create?mode=extend&trackId=${track.id}`);
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
      label: track.is_liked ? 'В избранном' : 'Лайк',
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
      id: 'studio',
      icon: Layers,
      label: 'Студия',
      onClick: handleOpenStudio,
      color: 'warning' as const,
    },
    {
      id: 'extend',
      icon: Plus,
      label: 'Расширить',
      onClick: handleExtend,
      color: 'success' as const,
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Поделиться',
      onClick: handleShare,
    },
    {
      id: 'download',
      icon: Download,
      label: 'Скачать',
      onClick: handleDownload,
      disabled: !track.audio_url,
    },
  ], [isTrackPlaying, track.is_liked, track.audio_url, track.id]);

  return (
    <div className="py-3 -mx-4">
      <div className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const colorClass = action.color ? colorVariants[action.color] : colorVariants.default;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex-shrink-0 gap-2 h-11 px-4 rounded-full border transition-all",
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
                <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
