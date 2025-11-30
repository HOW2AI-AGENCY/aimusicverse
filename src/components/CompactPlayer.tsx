import { useState } from 'react';
import { Play, Pause, X, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioWaveform } from '@/components/AudioWaveform';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';

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
  };
  onClose: () => void;
  onMaximize: () => void;
}

export function CompactPlayer({ track, onClose, onMaximize }: CompactPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

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
    <Card className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:w-[400px] z-40 glass-card border-primary/20 p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {track.cover_url && (
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-12 h-12 rounded-md object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate">
              {track.title || 'Без названия'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMaximize}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Waveform with click to seek */}
      <div className="mb-3">
        {lyricsData?.waveformData && lyricsData.waveformData.length > 0 ? (
          <AudioWaveform
            waveformData={lyricsData.waveformData}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />
        ) : (
          <div className="h-20 bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">
            Waveform загружается...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          disabled={!track.audio_url}
          className="h-10 w-10 flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Volume Control */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 flex-shrink-0"
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
        />
      </div>
    </Card>
  );
}
