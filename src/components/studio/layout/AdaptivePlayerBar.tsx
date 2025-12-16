/**
 * AdaptivePlayerBar - Professional player controls
 * Desktop: Full player with all controls
 * Mobile: Compact mini-player
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Volume1,
  Repeat, Repeat1, Shuffle,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdaptivePlayerBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (direction: 'back' | 'forward') => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  className?: string;
  trackTitle?: string;
  trackArtist?: string;
  coverUrl?: string;
}

export function AdaptivePlayerBar({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onSkip,
  onVolumeChange,
  onMuteToggle,
  className,
  trackTitle,
  trackArtist,
  coverUrl,
}: AdaptivePlayerBarProps) {
  const isMobile = useIsMobile();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2;

  // Mobile: Compact mini-player
  if (isMobile) {
    return (
      <div className={cn(
        "relative bg-card/95 backdrop-blur-xl border-t border-border/50",
        className
      )}>
        {/* Progress Bar - Top edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Track Info */}
          {(trackTitle || coverUrl) && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {coverUrl && (
                <img 
                  src={coverUrl} 
                  alt="" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{trackTitle || 'Трек'}</p>
                {trackArtist && (
                  <p className="text-xs text-muted-foreground truncate">{trackArtist}</p>
                )}
              </div>
            </div>
          )}

          {/* Time Display */}
          <div className="text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSkip('back')}
              className="h-10 w-10 rounded-full"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={onTogglePlay}
              className={cn(
                "h-12 w-12 rounded-full",
                "bg-gradient-to-br from-primary to-primary/80",
                "shadow-lg shadow-primary/25"
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSkip('forward')}
              className="h-10 w-10 rounded-full"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Full player
  return (
    <div className={cn(
      "px-6 py-4 border-t border-border/50",
      "bg-gradient-to-t from-card/95 to-card/80 backdrop-blur-xl",
      className
    )}>
      {/* Progress Bar */}
      <div className="mb-4 group">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={(val) => onSeek(val[0])}
          className="w-full"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Left: Track info (if provided) */}
        <div className="flex items-center gap-3 w-1/4">
          {coverUrl && (
            <img 
              src={coverUrl} 
              alt="" 
              className="w-12 h-12 rounded-lg object-cover shadow-md"
            />
          )}
          {trackTitle && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{trackTitle}</p>
              {trackArtist && (
                <p className="text-xs text-muted-foreground truncate">{trackArtist}</p>
              )}
            </div>
          )}
        </div>

        {/* Center: Transport Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('back')}
            className="h-10 w-10 rounded-full hover:bg-muted/50"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={onTogglePlay}
            className={cn(
              "h-14 w-14 rounded-full",
              "bg-gradient-to-br from-primary to-primary/80",
              "shadow-xl shadow-primary/30",
              "hover:shadow-2xl hover:scale-105 transition-all"
            )}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('forward')}
            className="h-10 w-10 rounded-full hover:bg-muted/50"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Right: Volume & Additional Controls */}
        <div className="flex items-center justify-end gap-2 w-1/4">
          <div 
            className="flex items-center gap-2"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              className="h-9 w-9 rounded-full"
            >
              <VolumeIcon className="w-4 h-4" />
            </Button>
            
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 100, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Slider
                    value={[muted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(val) => onVolumeChange(val[0] / 100)}
                    className="w-24"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
