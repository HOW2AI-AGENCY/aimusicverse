import { useState } from 'react';
import { Play, Pause, X, Maximize2, Volume2, VolumeX, Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioWaveform } from '@/components/AudioWaveform';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useTracks } from '@/hooks/useTracksOptimized';
import { cn } from '@/lib/utils';

interface CompactPlayerProps {
  track: {
    id: string;
    title?: string | null;
    audio_url?: string | null;
    streaming_url?: string | null;
    local_audio_url?: string | null;
    cover_url?: string | null;
    suno_task_id?: string | null;
    suno_id?: string | null;
    is_liked?: boolean;
  };
  onClose: () => void;
  onMaximize: () => void;
}

export function CompactPlayer({ track, onClose, onMaximize }: CompactPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const { toggleLike, downloadTrack } = useTracks();

  const {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    setVolume: setAudioVolume,
  } = useAudioPlayer({
    trackId: track.id,
    streamingUrl: track.streaming_url,
    localAudioUrl: track.local_audio_url,
    audioUrl: track.audio_url,
  });

  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );

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

  return (
    <Card className="fixed bottom-20 sm:bottom-20 md:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:w-[400px] z-40 glass-card border-primary/20 p-3 sm:p-4 shadow-2xl rounded-2xl bottom-nav-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {track.cover_url && (
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold truncate">
              {track.title || 'Без названия'}
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMaximize}
            className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation active:scale-95"
            aria-label="Развернуть плеер"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation active:scale-95"
            aria-label="Закрыть плеер"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Waveform with click to seek */}
      <div className="mb-2 sm:mb-3">
        {lyricsData?.waveformData && lyricsData.waveformData.length > 0 ? (
          <AudioWaveform
            waveformData={lyricsData.waveformData}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />
        ) : (
          <div className="h-16 sm:h-20 bg-muted/20 rounded flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground">
            Waveform загружается...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          disabled={!track.audio_url}
          className="h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0 touch-manipulation active:scale-95 shadow-lg"
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleLike({ trackId: track.id, isLiked: track.is_liked || false })}
            className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0 touch-manipulation active:scale-95"
            aria-label={track.is_liked ? "Убрать из избранного" : "Добавить в избранное"}
            disabled={!track.id}
        >
            <Heart className={cn("h-4 w-4", track.is_liked && "fill-current text-red-500")} />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => downloadTrack({ trackId: track.id, audioUrl: track.audio_url!, coverUrl: track.cover_url! })}
            className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0 touch-manipulation active:scale-95"
            aria-label="Скачать трек"
            disabled={!track.audio_url}
        >
            <Download className="h-4 w-4" />
        </Button>

        {/* Volume Control - Hide on small screens */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 flex-shrink-0"
            aria-label={muted ? "Включить звук" : "Выключить звук"}
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
            className="flex-1"
            aria-label="Громкость"
          />
        </div>
      </div>
    </Card>
  );
}
