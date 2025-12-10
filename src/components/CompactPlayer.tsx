import { useState, useCallback, useEffect } from 'react';
import { X, Maximize2, Volume2, VolumeX, Heart, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { AudioWaveform } from '@/components/AudioWaveform';
import { useAudioTime, getGlobalAudioRef } from '@/hooks/audio';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useTracks } from '@/hooks/useTracksOptimized';
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { VersionSwitcher } from '@/components/player/VersionSwitcher';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { Track } from '@/hooks/useTracksOptimized';
import { toast } from 'sonner';

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
    status?: string | null;
  };
  onClose: () => void;
  onMaximize: () => void;
  onExpand?: () => void;
}

export function CompactPlayer({ track, onClose, onMaximize, onExpand }: CompactPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toggleLike, downloadTrack } = useTracks();

  // Use global audio time from provider
  const { currentTime, duration, seek } = useAudioTime();

  // Check if track has valid audio source
  const hasAudioSource = !!(track.streaming_url || track.local_audio_url || track.audio_url);
  const isProcessing = track.status === 'processing' || track.status === 'pending';

  // Monitor audio loading state
  useEffect(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };
    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

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

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    const audio = getGlobalAudioRef();
    if (audio) {
      audio.volume = newVolume;
    }
    if (newVolume > 0 && muted) setMuted(false);
  }, [muted]);

  const toggleMute = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    if (muted) {
      audio.volume = volume;
      setMuted(false);
    } else {
      audio.volume = 0;
      setMuted(true);
    }
  }, [muted, volume]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    if (info.offset.y < -50 && onExpand) {
      hapticImpact('light');
      onExpand();
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="fixed bottom-20 sm:bottom-20 md:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:w-[400px] z-40 bottom-nav-safe"
    >
      <Card className="glass-card border-primary/20 p-3 sm:p-4 shadow-2xl rounded-2xl">
        {/* Swipe indicator */}
        {onExpand && (
          <div className="flex justify-center mb-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Cover with loading/error indicators */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              {track.cover_url ? (
                <img
                  src={track.cover_url}
                  alt={track.title || 'Track cover'}
                  className="w-full h-full rounded-md object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-md bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">🎵</span>
                </div>
              )}

              {/* Loading indicator overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 rounded-md flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}

              {/* Error indicator overlay */}
              {hasError && !isLoading && (
                <div className="absolute inset-0 bg-destructive/20 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate">
                {track.title || 'Без названия'}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
                {!hasAudioSource && (
                  <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Нет аудио
                  </span>
                )}
                {isLoading && (
                  <span className="text-[10px] text-primary">Загрузка...</span>
                )}
              </div>
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

        {/* Waveform / Progress Bar */}
        <div className="mb-2 sm:mb-3">
          {lyricsData?.waveformData && lyricsData.waveformData.length > 0 ? (
            <AudioWaveform
              waveformData={lyricsData.waveformData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              height={12}
              className="sm:h-4"
            />
          ) : (
            // Unified minimal progress bar - no random visuals
            <div 
              className="h-3 sm:h-4 bg-muted/10 rounded-lg relative cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                seek(percent * duration);
              }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20" />
              
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/40 to-primary/20 transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Center indicator line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/50 transition-all duration-100"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-primary/10 to-transparent" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left side: Like & Download */}
          <div className="flex items-center gap-1">
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
          </div>

          {/* Center: Playback Controls + Version Switcher */}
          <div className="flex-1 flex items-center justify-center gap-2">
            {hasAudioSource ? (
              <>
                <PlaybackControls size="compact" />
                <VersionSwitcher track={track as Track} size="compact" />
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isProcessing ? 'Генерация...' : 'Аудио недоступно'}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Volume (desktop only) */}
          <div className="hidden sm:flex items-center gap-2">
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
              className="w-20"
              aria-label="Громкость"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
