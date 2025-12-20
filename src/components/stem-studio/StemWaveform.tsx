import { useEffect, useRef, useState, useCallback, memo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface StemWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  color?: string;
  height?: number;
  onSeek?: (time: number) => void;
}

// HSL-based color map for design system consistency
const colorMap: Record<string, { wave: string; progress: string }> = {
  blue: { wave: 'hsl(207 90% 54% / 0.4)', progress: 'hsl(207 90% 54% / 0.8)' },
  cyan: { wave: 'hsl(188 80% 43% / 0.4)', progress: 'hsl(188 80% 43% / 0.8)' },
  orange: { wave: 'hsl(25 95% 53% / 0.4)', progress: 'hsl(25 95% 53% / 0.8)' },
  purple: { wave: 'hsl(270 70% 65% / 0.4)', progress: 'hsl(270 70% 65% / 0.8)' },
  amber: { wave: 'hsl(38 95% 50% / 0.4)', progress: 'hsl(38 95% 50% / 0.8)' },
  pink: { wave: 'hsl(330 75% 60% / 0.4)', progress: 'hsl(330 75% 60% / 0.8)' },
  emerald: { wave: 'hsl(160 70% 40% / 0.4)', progress: 'hsl(160 70% 40% / 0.8)' },
  yellow: { wave: 'hsl(48 95% 48% / 0.4)', progress: 'hsl(48 95% 48% / 0.8)' },
  lime: { wave: 'hsl(84 80% 44% / 0.4)', progress: 'hsl(84 80% 44% / 0.8)' },
  red: { wave: 'hsl(0 72% 51% / 0.4)', progress: 'hsl(0 72% 51% / 0.8)' },
  violet: { wave: 'hsl(250 80% 60% / 0.4)', progress: 'hsl(250 80% 60% / 0.8)' },
  teal: { wave: 'hsl(175 70% 40% / 0.4)', progress: 'hsl(175 70% 40% / 0.8)' },
  sky: { wave: 'hsl(200 90% 48% / 0.4)', progress: 'hsl(200 90% 48% / 0.8)' },
  green: { wave: 'hsl(145 65% 45% / 0.4)', progress: 'hsl(145 65% 45% / 0.8)' },
  gray: { wave: 'hsl(220 10% 55% / 0.4)', progress: 'hsl(220 10% 55% / 0.8)' },
};

export const StemWaveform = memo(({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  color = 'blue',
  height = 40,
  onSeek,
}: StemWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const colors = colorMap[color] || colorMap.blue;

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    setIsLoading(true);
    setIsReady(false);

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: colors.wave,
      progressColor: colors.progress,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 0,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
      hideScrollbar: true,
      fillParent: true,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setIsReady(true);
      setIsLoading(false);
    });

    wavesurfer.on('error', (err: any) => {
      // Suppress AbortError as it's expected during cleanup
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }
      logger.error('Waveform error', err);
      setIsLoading(false);
    });

    wavesurfer.on('click', (relativeX) => {
      if (onSeek && duration > 0) {
        onSeek(relativeX * duration);
      }
    });

    wavesurfer.load(audioUrl);

    return () => {
      try {
        wavesurfer.destroy();
      } catch (e: any) {
        // Suppress AbortError during cleanup
        if (e?.name !== 'AbortError') {
          logger.error('Waveform destroy error', e);
        }
      }
      wavesurferRef.current = null;
    };
  }, [audioUrl, height]);

  // Performance optimization: Only update waveform progress when needed
  // 1% threshold (0.01) reduces unnecessary updates during playback
  const PROGRESS_UPDATE_THRESHOLD = 0.01; // 1% of duration

  // Sync time with external audio - optimized with throttling
  useEffect(() => {
    if (wavesurferRef.current && isReady && duration > 0) {
      const progress = currentTime / duration;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      
      // Only update if playing or significant change
      const currentProgress = (wavesurferRef.current.getCurrentTime() || 0) / duration;
      if (isPlaying || Math.abs(clampedProgress - currentProgress) > PROGRESS_UPDATE_THRESHOLD) {
        wavesurferRef.current.seekTo(clampedProgress);
      }
    }
  }, [currentTime, duration, isReady, isPlaying]);

  // Update colors when they change
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setOptions({
        waveColor: isMuted ? 'hsl(220 10% 40% / 0.2)' : colors.wave,
        progressColor: isMuted ? 'hsl(220 10% 40% / 0.4)' : colors.progress,
      });
    }
  }, [isMuted, colors, isReady]);

  return (
    <div className="relative w-full">
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded" style={{ height }} />
      )}
      <div 
        ref={containerRef} 
        className={cn(
          "w-full transition-opacity cursor-pointer",
          isLoading && "opacity-0",
          isMuted && "opacity-50"
        )}
        style={{ height }}
      />
    </div>
  );
});

StemWaveform.displayName = 'StemWaveform';
