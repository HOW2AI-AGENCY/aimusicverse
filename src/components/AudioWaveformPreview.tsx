import { useEffect, useRef, useState, useId, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { logger } from '@/lib/logger';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from '@/hooks/studio/useStudioAudio';

type WaveSurferCtor = typeof import('wavesurfer.js');
type WaveSurferInstance = any;

interface AudioWaveformPreviewProps {
  audioUrl: string;
  className?: string;
}

export const AudioWaveformPreview = ({ audioUrl, className }: AudioWaveformPreviewProps) => {
  const sourceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  useEffect(() => {
    // Initialize loading state outside of effect body when possible
    let mounted = true;

    const initWavesurfer = async () => {
      if (!mounted) return;

      if (!containerRef.current || !audioUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);

      try {
        const mod: WaveSurferCtor = await import('wavesurfer.js');
        const WaveSurfer = (mod as any).default ?? (mod as any);
        if (!mounted) return;

        const wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          height: 48,
          waveColor: 'hsl(var(--muted-foreground) / 0.4)',
          progressColor: 'hsl(var(--primary))',
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          cursorWidth: 1,
          cursorColor: 'hsl(var(--primary))',
          normalize: true,
          backend: 'WebAudio',
          interact: true,
          hideScrollbar: true,
          fillParent: true,
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          if (!mounted) return;
          setIsReady(true);
          setIsLoading(false);
          setDuration(wavesurfer.getDuration());
        });

        wavesurfer.on('error', (err: unknown) => {
          logger.error('Waveform error', { error: err });
          if (mounted) {
            setIsLoading(false);
          }
        });

        wavesurfer.on('audioprocess', () => {
          if (mounted) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('play', () => {
          if (mounted) setIsPlaying(true);
        });
        wavesurfer.on('pause', () => {
          if (mounted) setIsPlaying(false);
        });
        wavesurfer.on('finish', () => {
          if (mounted) setIsPlaying(false);
        });

        // Register for audio coordination
        registerStudioAudio(`waveform-preview-${sourceId}`, () => {
          wavesurfer.pause();
        });

        wavesurfer.load(audioUrl);
      } catch (e) {
        logger.error('Failed to init WaveSurfer', e);
        if (mounted) setIsLoading(false);
      }
    };

    initWavesurfer();

    return () => {
      mounted = false;
      unregisterStudioAudio(`waveform-preview-${sourceId}`);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, sourceId]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying && wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
  }, [globalIsPlaying, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (!wavesurferRef.current) return;
    
    if (!isPlaying) {
      // Pause global player and other studio audio before playing
      pauseTrack();
      pauseAllStudioAudio(`waveform-preview-${sourceId}`);
    }
    
    wavesurferRef.current.playPause();
  }, [isPlaying, pauseTrack, sourceId]);

  return (
    <div className={cn('rounded-lg bg-muted/30 p-3', className)}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={togglePlayPause}
          disabled={!isReady}
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
          <div ref={containerRef} className="w-full" />
        </div>
        
        <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
