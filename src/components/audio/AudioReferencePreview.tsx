/**
 * Enhanced Audio Reference Preview Component
 * Displays waveform visualization, file info, and playback controls
 */

import { useState, useEffect, useRef, useId, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Loader2, Music, X, FileAudio, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { logger } from '@/lib/logger';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

type WaveSurferCtor = typeof import('wavesurfer.js');
type WaveSurferInstance = any;

interface AudioReferencePreviewProps {
  file: File;
  audioUrl: string | null;
  duration: number | null;
  onRemove: () => void;
  error?: string | null;
  className?: string;
  modelLimit?: { duration: number; label: string };
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get audio format from MIME type
function getAudioFormat(mimeType: string): string {
  const formats: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/wav': 'WAV',
    'audio/wave': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/flac': 'FLAC',
    'audio/x-flac': 'FLAC',
    'audio/aac': 'AAC',
    'audio/mp4': 'M4A',
    'audio/x-m4a': 'M4A',
    'audio/webm': 'WebM',
  };
  return formats[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Audio';
}

export const AudioReferencePreview = memo(function AudioReferencePreview({
  file,
  audioUrl,
  duration,
  onRemove,
  error,
  className,
  modelLimit,
}: AudioReferencePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformError, setWaveformError] = useState(false);

  // Register for studio audio coordination
  useEffect(() => {
    if (wavesurferRef.current) {
      registerStudioAudio(sourceId, () => {
        wavesurferRef.current?.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId, isReady]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      wavesurferRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  // Initialize WaveSurfer
  useEffect(() => {
    let mounted = true;

    const initWavesurfer = async () => {
      if (!mounted || !containerRef.current || !audioUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);
      setWaveformError(false);

      try {
        const mod: WaveSurferCtor = await import('wavesurfer.js');
        const WaveSurfer = (mod as any).default ?? (mod as any);

        if (!mounted) return;

        const wavesurfer: WaveSurferInstance = WaveSurfer.create({
          container: containerRef.current,
          height: 48,
          waveColor: 'hsl(var(--muted-foreground) / 0.4)',
          progressColor: 'hsl(var(--primary))',
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          cursorWidth: 1,
          cursorColor: 'hsl(var(--primary))',
          normalize: true,
          interact: true,
          hideScrollbar: true,
          fillParent: true,
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          if (!mounted) return;
          setIsReady(true);
          setIsLoading(false);
        });

        wavesurfer.on('error', (err: unknown) => {
          logger.warn('Waveform load error', { error: err });
          if (mounted) {
            setIsLoading(false);
            setWaveformError(true);
          }
        });

        wavesurfer.on('audioprocess', () => {
          if (mounted) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('seeking', () => {
          if (mounted) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('play', () => mounted && setIsPlaying(true));
        wavesurfer.on('pause', () => mounted && setIsPlaying(false));
        wavesurfer.on('finish', () => mounted && setIsPlaying(false));

        wavesurfer.load(audioUrl);
      } catch (e) {
        logger.error('Failed to init WaveSurfer', e);
        if (mounted) {
          setIsLoading(false);
          setWaveformError(true);
        }
      }
    };

    initWavesurfer();

    return () => {
      mounted = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        pauseTrack();
        pauseAllStudioAudio(sourceId);
        wavesurferRef.current.play();
      }
    }
  };

  const fileFormat = getAudioFormat(file.type);
  const fileSize = formatFileSize(file.size);
  const durationDisplay = duration ? formatTime(duration) : '--:--';
  const withinLimit = modelLimit && duration ? duration <= modelLimit.duration : true;

  return (
    <div className={cn('rounded-lg bg-muted/50 border border-border overflow-hidden', className)}>
      {/* Header with file info */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileAudio className="w-3 h-3" />
              {fileFormat}
            </span>
            <span>•</span>
            <span>{fileSize}</span>
            <span>•</span>
            <span className={cn(!withinLimit && 'text-destructive font-medium')}>
              {durationDisplay}
            </span>
            {modelLimit && (
              <>
                <span>/</span>
                <span className="text-muted-foreground">{modelLimit.label}</span>
              </>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Waveform visualization */}
      <div className="px-3 pb-3">
        <div className="rounded-md bg-background/50 p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={togglePlayPause}
              disabled={!isReady && !waveformError}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              {waveformError ? (
                <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                  <span>Предпросмотр недоступен</span>
                </div>
              ) : (
                <div ref={containerRef} className="w-full h-12" />
              )}
            </div>

            <div className="text-xs text-muted-foreground tabular-nums shrink-0 w-16 text-right">
              {formatTime(currentTime)} / {durationDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-3 pb-3">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
});

export default AudioReferencePreview;
