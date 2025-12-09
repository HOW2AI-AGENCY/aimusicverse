import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAudioPlayer } from '@/hooks/audio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  trackId: string;
  title?: string;
  streamingUrl?: string | null;
  localAudioUrl?: string | null;
  audioUrl?: string | null;
  coverUrl?: string | null;
  onPlay?: () => void;
  className?: string;
}

export const AudioPlayer = ({
  trackId,
  title,
  streamingUrl,
  localAudioUrl,
  audioUrl,
  coverUrl,
  onPlay,
  className,
}: AudioPlayerProps) => {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const {
    isPlaying,
    currentTime,
    duration,
    buffered,
    loading,
    togglePlay,
    seek,
    setVolume: setAudioVolume,
  } = useAudioPlayer({
    trackId,
    streamingUrl,
    localAudioUrl,
    audioUrl,
    onPlay,
  });

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setAudioVolume(newVolume);
    if (newVolume > 0 && muted) setMuted(false);
  };

  const toggleMute = () => {
    if (muted) {
      setAudioVolume(volume);
      setMuted(false);
    } else {
      setAudioVolume(0);
      setMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  return (
    <Card className={cn('glass-card border-primary/20 p-4', className)}>
      <div className="flex items-center gap-4">
        {/* Cover Image */}
        {coverUrl && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={coverUrl}
              alt={title || 'Track cover'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-sm truncate mb-1">{title}</h3>
          )}

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              {/* Buffered progress */}
              <div
                className="absolute h-full bg-secondary-foreground/20 transition-all"
                style={{ width: `${buffered}%` }}
              />
              {/* Current progress */}
              <div
                className="absolute h-full bg-primary transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Seeker */}
            {duration > 0 && (
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
            )}

            {/* Time */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[muted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            disabled={!audioUrl && !streamingUrl && !localAudioUrl}
            className="h-10 w-10"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};