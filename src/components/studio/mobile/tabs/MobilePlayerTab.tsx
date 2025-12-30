/**
 * MobilePlayerTab - Main player interface for mobile
 *
 * Features:
 * - Compact waveform visualization (60-80px height)
 * - Touch-optimized playback controls
 * - Track info and metadata
 * - Swipe gestures for quick navigation
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from '@/lib/motion';
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
import { UnifiedWaveformTimeline } from '@/components/stem-studio/UnifiedWaveformTimeline';
import { useTracks } from '@/hooks/useTracks';
import { useTrackLike } from '@/hooks/useTrackLike';
import { formatTime } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MobilePlayerTabProps {
  trackId?: string;
  projectId?: string;
  mode: 'track' | 'project';
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
}

export default function MobilePlayerTab({
  trackId,
  projectId,
  mode,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  onTogglePlay
}: MobilePlayerTabProps) {
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const { isLiked, toggleLike } = useTrackLike(trackId);

  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Waveform container ref
  const waveformContainerRef = useRef<HTMLDivElement>(null);

  // Auto-hide volume slider after 3 seconds
  useEffect(() => {
    if (showVolumeSlider) {
      const timeout = setTimeout(() => setShowVolumeSlider(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showVolumeSlider]);

  const handleShare = () => {
    if (track) {
      // Telegram share API
      const shareUrl = `${window.location.origin}/track/${track.id}`;
      const shareText = `Послушай мой трек "${track.title}" 🎵`;

      if (window.Telegram?.WebApp?.openTelegramLink) {
        const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encoded}`);
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          navigator.share({
            title: track.title,
            text: shareText,
            url: shareUrl,
          }).catch(() => {
            // User cancelled
          });
        } else {
          // Fallback to copy to clipboard
          navigator.clipboard.writeText(shareUrl);
          toast.success('Ссылка скопирована!');
        }
      }
    }
  };

  const handleDownload = () => {
    if (track?.audio_url) {
      window.open(track.audio_url, '_blank');
    }
  };

  if (mode === 'track' && !track) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Трек не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/10">
      {/* Track Cover - Large on Player tab */}
      {mode === 'track' && track?.cover_url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 pt-6 pb-4"
        >
          <div className="relative mx-auto max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </motion.div>
      )}

      {/* Track Info */}
      <div className="px-6 py-3">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold mb-1 truncate"
        >
          {mode === 'track' ? (track?.title || 'Без названия') : 'Проект'}
        </motion.h2>
        {mode === 'track' && track?.tags && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-muted-foreground truncate"
          >
            {track.tags.split(',').slice(0, 3).map(t => t.trim()).join(' · ')}
          </motion.p>
        )}
      </div>

      {/* Waveform */}
      <div ref={waveformContainerRef} className="px-3 py-2">
        <div className="bg-card/40 rounded-xl border border-border/30 p-2">
          {mode === 'track' && track?.audio_url ? (
            <UnifiedWaveformTimeline
              audioUrl={track.audio_url}
              sections={[]}
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={onSeek}
              height={70}
              showSectionLabels={false}
            />
          ) : (
            <div className="h-[70px] flex items-center justify-center text-muted-foreground text-xs">
              Waveform недоступен
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
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
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="h-12 w-12 rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={onTogglePlay}
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
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
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
            onClick={() => {
              setMuted(!muted);
              setShowVolumeSlider(true);
            }}
            className="h-10 w-10 rounded-full shrink-0"
          >
            {muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          {showVolumeSlider && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0.8 }}
              className="flex-1"
            >
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={(val) => setVolume(val[0])}
                className="w-full"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {mode === 'track' && track && (
        <div className="px-6 py-4 mt-auto border-t border-border/30">
          <div className="flex items-center justify-around gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLike}
              className={cn(
                "h-12 w-12 rounded-full",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-12 w-12 rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-12 w-12 rounded-full"
            >
              <Download className="w-5 h-5" />
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                  Добавить в плейлист
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                  Детали трека
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Скоро')}>
                  Сообщить о проблеме
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Track Stats */}
      {mode === 'track' && track && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {track.duration_seconds && (
              <Badge variant="secondary" className="text-[10px]">
                {formatTime(track.duration_seconds)}
              </Badge>
            )}
            {track.tags && (
              <Badge variant="secondary" className="text-[10px]">
                {track.tags.split(',')[0]?.trim()}
              </Badge>
            )}
            {track.is_instrumental && (
              <Badge variant="secondary" className="text-[10px]">
                Инструментал
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
