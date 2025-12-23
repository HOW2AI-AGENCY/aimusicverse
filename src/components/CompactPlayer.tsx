import { useState, useCallback, useEffect } from 'react';
import { X, Maximize2, Volume2, VolumeX, Heart, Download, AlertCircle, Loader2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { AudioWaveform } from '@/components/AudioWaveform';
import { useAudioTime, getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useTracks } from '@/hooks/useTracks';
import { PlaybackControls } from '@/components/player/PlaybackControls';
import { VersionSwitcher } from '@/components/player/VersionSwitcher';
import { LazyImage } from '@/components/ui/lazy-image';
import { TouchTarget, triggerHaptic } from '@/components/ui/touch-friendly';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { hapticImpact } from '@/lib/haptic';
import type { Track } from '@/types/track';
import { toast } from 'sonner';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';

interface TrackVersion {
  id: string;
  metadata?: Record<string, unknown> | null;
}

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
  currentVersion?: TrackVersion | null;
  onClose: () => void;
  onMaximize: () => void;
  onExpand?: () => void;
}

export function CompactPlayer({ track, currentVersion, onClose, onMaximize, onExpand }: CompactPlayerProps) {
  // Use store volume for consistency
  const { volume: storeVolume, setVolume: setStoreVolume, preservedTime, clearPreservedTime } = usePlayerStore();
  const [muted, setMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const { toggleLike, downloadTrack } = useTracks();

  // Use global audio time from provider
  const { currentTime, duration, seek } = useAudioTime();

  // Check if track has valid audio source
  const hasAudioSource = !!(track.streaming_url || track.local_audio_url || track.audio_url);
  const isProcessing = track.status === 'processing' || track.status === 'pending';
  
  // Restore preserved time on mount (from mode switch)
  useEffect(() => {
    if (preservedTime !== null && !isNaN(preservedTime)) {
      const audio = getGlobalAudioRef();
      if (audio) {
        const timer = setTimeout(() => {
          audio.currentTime = preservedTime;
          clearPreservedTime();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [preservedTime, clearPreservedTime]);

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

  // CRITICAL: Use version-specific suno_task_id/suno_id for correct lyrics sync
  const versionMetadata = currentVersion?.metadata as { suno_task_id?: string; suno_id?: string } | undefined;
  const lyricsTaskId = versionMetadata?.suno_task_id || track.suno_task_id || null;
  const lyricsAudioId = versionMetadata?.suno_id || track.suno_id || null;
  
  const { data: lyricsData } = useTimestampedLyrics(lyricsTaskId, lyricsAudioId);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setStoreVolume(newVolume);
    const audio = getGlobalAudioRef();
    if (audio) {
      audio.volume = newVolume;
    }
    if (newVolume > 0 && muted) setMuted(false);
  }, [muted, setStoreVolume]);

  const toggleMute = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio) return;
    
    if (muted) {
      audio.volume = storeVolume;
      setMuted(false);
    } else {
      audio.volume = 0;
      setMuted(true);
    }
  }, [muted, storeVolume]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    if (info.offset.y < -50 && onExpand) {
      hapticImpact('light');
      onExpand();
    }
  };

  return (
    <>
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.25rem)] sm:bottom-[calc(4rem+0.5rem)] md:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:w-[400px] z-40"
    >
      <Card className="glass-card border-primary/20 p-2.5 sm:p-3 shadow-xl rounded-xl">
        {/* Swipe indicator - mobile only */}
        {onExpand && (
          <div className="flex justify-center mb-1.5 md:hidden">
            <div className="w-10 h-0.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Cover with loading/error indicators */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
              {track.cover_url ? (
                <LazyImage
                  src={track.cover_url}
                  alt={track.title || 'Track cover'}
                  className="w-full h-full rounded-lg object-cover"
                  containerClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">🎵</span>
                </div>
              )}

              {/* Loading indicator overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </div>
              )}

              {/* Error indicator overlay */}
              {hasError && !isLoading && (
                <div className="absolute inset-0 bg-destructive/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-yellow-500 rounded-full border border-background animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate">
                {track.title || 'Без названия'}
              </h4>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
                {!hasAudioSource && (
                  <span className="text-[9px] text-yellow-500 flex items-center gap-0.5">
                    <AlertCircle className="h-2.5 w-2.5" />
                    Нет аудио
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <TouchTarget>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  triggerHaptic('light');
                  onMaximize();
                }}
                className="h-8 w-8"
                aria-label="Развернуть плеер"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </TouchTarget>
            <TouchTarget>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="h-8 w-8"
                aria-label="Закрыть плеер"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TouchTarget>
          </div>
        </div>

        {/* Waveform / Progress Bar */}
        <div className="mb-2">
          {lyricsData?.waveformData && lyricsData.waveformData.length > 0 ? (
            <AudioWaveform
              waveformData={lyricsData.waveformData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              height={10}
            />
          ) : (
            // Unified minimal progress bar
            <div 
              className="h-2.5 bg-muted/10 rounded-full relative cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                seek(percent * duration);
              }}
            >
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0 bg-primary/50 transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Progress indicator */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary transition-all duration-100"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-1">
          {/* Left side: Like & Playlist - Always visible */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <TouchTarget>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  triggerHaptic('light');
                  toggleLike({ trackId: track.id, isLiked: track.is_liked || false });
                }}
                className="h-8 w-8"
                aria-label={track.is_liked ? "Убрать из избранного" : "Добавить в избранное"}
                disabled={!track.id}
              >
                <Heart className={cn("h-3.5 w-3.5", track.is_liked && "fill-current text-red-500")} />
              </Button>
            </TouchTarget>
            <TouchTarget>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  triggerHaptic('light');
                  setPlaylistDialogOpen(true);
                }}
                className="h-8 w-8"
                aria-label="Добавить в плейлист"
                disabled={!track.id}
              >
                <ListPlus className="h-3.5 w-3.5" />
              </Button>
            </TouchTarget>
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
              {muted || storeVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[muted ? 0 : storeVolume]}
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
    
    {/* Add to Playlist Dialog */}
    <AddToPlaylistDialog
      open={playlistDialogOpen}
      onOpenChange={setPlaylistDialogOpen}
      track={track as Track}
    />
    </>
  );
}
