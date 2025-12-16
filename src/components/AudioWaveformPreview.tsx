import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { logger } from '@/lib/logger';

interface AudioWaveformPreviewProps {
  audioUrl: string;
  className?: string;
}

export const AudioWaveformPreview = ({ audioUrl, className }: AudioWaveformPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Initialize loading state outside of effect body when possible
    let mounted = true;
    
    const initWavesurfer = () => {
      if (!mounted) return;
      
      if (!containerRef.current || !audioUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);

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
        if (mounted) {
          setIsReady(true);
          setIsLoading(false);
          setDuration(wavesurfer.getDuration());
        }
      });

      wavesurfer.on('error', (err) => {
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

      wavesurferRef.current = wavesurfer;
      wavesurfer.load(audioUrl);
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
      wavesurferRef.current.playPause();
    }
  };

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
