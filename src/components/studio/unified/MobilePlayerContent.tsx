/**
 * MobilePlayerContent - Player tab content for mobile studio
 * Displays waveform, playback controls, and track info
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Share2, Download, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudioWaveformTimeline } from './StudioWaveformTimeline';
import { formatTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StudioProject } from '@/stores/useUnifiedStudioStore';

interface MobilePlayerContentProps {
  project: StudioProject;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const MobilePlayerContent = memo(function MobilePlayerContent({
  project,
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  onPlayPause,
  onSeek,
  onVolumeChange,
}: MobilePlayerContentProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const isMuted = masterVolume === 0;

  // Get main audio URL for waveform
  const mainAudioUrl = project.tracks[0]?.audioUrl || project.tracks[0]?.clips?.[0]?.audioUrl;

  // Auto-hide volume slider
  useEffect(() => {
    if (showVolumeSlider) {
      const timeout = setTimeout(() => setShowVolumeSlider(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showVolumeSlider]);

  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    const skipAmount = 10;
    const newTime = direction === 'back'
      ? Math.max(0, currentTime - skipAmount)
      : Math.min(duration, currentTime + skipAmount);
    onSeek(newTime);
  }, [currentTime, duration, onSeek]);

  const toggleMute = useCallback(() => {
    onVolumeChange(isMuted ? 0.85 : 0);
    setShowVolumeSlider(true);
  }, [isMuted, onVolumeChange]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/studio-v2/project/${project.id}`;
    const shareText = `Послушай мой проект "${project.name}" 🎵`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encoded}`);
    } else if (navigator.share) {
      navigator.share({
        title: project.name,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Ссылка скопирована!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/10 overflow-y-auto">
      {/* Project Header */}
      <div className="px-4 pt-4 pb-2">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold mb-1 truncate"
        >
          {project.name}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2"
        >
          <Badge variant="secondary" className="text-xs">
            {project.tracks.length} {project.tracks.length === 1 ? 'дорожка' : 'дорожек'}
          </Badge>
          {project.bpm && (
            <Badge variant="outline" className="text-xs">
              {project.bpm} BPM
            </Badge>
          )}
        </motion.div>
      </div>

      {/* Waveform */}
      <div className="px-3 py-2">
        <div className="bg-card/40 rounded-xl border border-border/30 p-2">
          {mainAudioUrl ? (
            <StudioWaveformTimeline
              audioUrl={mainAudioUrl}
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={onSeek}
              height={80}
            />
          ) : (
            <div className="h-[80px] flex items-center justify-center text-muted-foreground text-xs">
              Добавьте дорожку для визуализации
            </div>
          )}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="px-6 py-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={(val) => onSeek(val[0])}
          className="w-full"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('back')}
            className="h-12 w-12 rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={onPlayPause}
            className="h-16 w-16 rounded-full shadow-lg shadow-primary/30"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('forward')}
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="px-6 py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10 rounded-full shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.8 }}
                className="flex-1"
              >
                <Slider
                  value={[masterVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={(val) => onVolumeChange(val[0])}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!showVolumeSlider && (
            <span className="text-xs text-muted-foreground">
              Громкость: {Math.round(masterVolume * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 mt-auto border-t border-border/30">
        <div className="flex items-center justify-around gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-12 w-12 rounded-full"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-popover">
              <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                Экспорт проекта
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                Детали проекта
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                Дублировать проект
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});
