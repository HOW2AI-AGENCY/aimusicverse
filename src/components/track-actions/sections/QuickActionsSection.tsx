/**
 * QuickActionsSection - Horizontal scrollable quick actions for track sheet
 * Shows most frequently used actions (Play, Like, Share, Download) in compact form
 */

import { memo } from 'react';
import { Play, Pause, Heart, Share2, Download, Link } from 'lucide-react';
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
  activeIcon?: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsSectionProps {
  track: Track;
  onClose: () => void;
  onDownload?: () => void;
}

export const QuickActionsSection = memo(function QuickActionsSection({ 
  track, 
  onClose,
  onDownload 
}: QuickActionsSectionProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
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
      // Play the new track
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

  const handleCopyLink = async () => {
    hapticImpact('light');
    const url = `${window.location.origin}/track/${track.id}`;
    await navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована');
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

  const quickActions: QuickAction[] = [
    {
      id: 'play',
      icon: isTrackPlaying ? Pause : Play,
      label: isTrackPlaying ? 'Пауза' : 'Играть',
      onClick: handlePlay,
    },
    {
      id: 'like',
      icon: Heart,
      label: track.is_liked ? 'Убрать лайк' : 'Лайк',
      isActive: track.is_liked,
      onClick: handleLike,
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Поделиться',
      onClick: handleShare,
    },
    {
      id: 'link',
      icon: Link,
      label: 'Ссылка',
      onClick: handleCopyLink,
    },
    {
      id: 'download',
      icon: Download,
      label: 'Скачать',
      onClick: handleDownload,
      disabled: !track.audio_url,
    },
  ];

  return (
    <div className="py-3 -mx-2">
      <div className="flex gap-2 overflow-x-auto pb-1 px-2 scrollbar-hide">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant={action.isActive ? 'default' : 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex-shrink-0 gap-2 h-10 px-4 rounded-full",
                  action.isActive && action.id === 'like' && "bg-red-500 hover:bg-red-600 text-white border-0"
                )}
              >
                <Icon 
                  className="w-4 h-4" 
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
