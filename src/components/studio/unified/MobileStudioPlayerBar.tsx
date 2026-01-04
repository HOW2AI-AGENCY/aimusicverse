/**
 * Mobile Studio Player Bar
 * Fixed player bar at the bottom of the screen for mobile studio
 * Provides play/pause, skip, time display and actions menu
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileStudioPlayerBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onMasterMuteToggle: () => void;
  onOpenActions: () => void;
  className?: string;
}

export const MobileStudioPlayerBar = memo(function MobileStudioPlayerBar({
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onMasterMuteToggle,
  onOpenActions,
  className,
}: MobileStudioPlayerBarProps) {
  const haptic = useHapticFeedback();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    haptic.select();
    onPlayPause();
  };

  const handleSkipBack = () => {
    haptic.tap();
    onSkipBack();
  };

  const handleSkipForward = () => {
    haptic.tap();
    onSkipForward();
  };

  const handleMasterMute = () => {
    haptic.select();
    onMasterMuteToggle();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    onSeek(newTime);
    haptic.tap();
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-xl border-t border-border/50",
        "pb-[calc(max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px))+0.75rem)]",
        className
      )}
    >
      {/* Progress bar */}
      <div 
        className="h-1 bg-muted cursor-pointer touch-manipulation"
        onClick={handleProgressClick}
      >
        <motion.div 
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* Time display */}
        <div className="flex items-center gap-1 min-w-[80px]">
          <span className="text-xs font-mono font-medium">
            {formatTime(currentTime)}
          </span>
          <span className="text-muted-foreground text-[10px]">/</span>
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 touch-manipulation"
            onClick={handleSkipBack}
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full touch-manipulation"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 touch-manipulation"
            onClick={handleSkipForward}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 min-w-[80px] justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={handleMasterMute}
          >
            {masterVolume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
            onClick={() => {
              haptic.tap();
              onOpenActions();
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});
