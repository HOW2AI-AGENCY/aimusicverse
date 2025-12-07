import { useEffect, useRef, useState, useCallback, memo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

const colorMap: Record<string, { wave: string; progress: string }> = {
  blue: { wave: 'rgba(59, 130, 246, 0.4)', progress: 'rgba(59, 130, 246, 0.8)' },
  cyan: { wave: 'rgba(6, 182, 212, 0.4)', progress: 'rgba(6, 182, 212, 0.8)' },
  orange: { wave: 'rgba(249, 115, 22, 0.4)', progress: 'rgba(249, 115, 22, 0.8)' },
  purple: { wave: 'rgba(168, 85, 247, 0.4)', progress: 'rgba(168, 85, 247, 0.8)' },
  amber: { wave: 'rgba(245, 158, 11, 0.4)', progress: 'rgba(245, 158, 11, 0.8)' },
  pink: { wave: 'rgba(236, 72, 153, 0.4)', progress: 'rgba(236, 72, 153, 0.8)' },
  emerald: { wave: 'rgba(16, 185, 129, 0.4)', progress: 'rgba(16, 185, 129, 0.8)' },
  yellow: { wave: 'rgba(234, 179, 8, 0.4)', progress: 'rgba(234, 179, 8, 0.8)' },
  lime: { wave: 'rgba(132, 204, 22, 0.4)', progress: 'rgba(132, 204, 22, 0.8)' },
  red: { wave: 'rgba(239, 68, 68, 0.4)', progress: 'rgba(239, 68, 68, 0.8)' },
  violet: { wave: 'rgba(139, 92, 246, 0.4)', progress: 'rgba(139, 92, 246, 0.8)' },
  teal: { wave: 'rgba(20, 184, 166, 0.4)', progress: 'rgba(20, 184, 166, 0.8)' },
  sky: { wave: 'rgba(14, 165, 233, 0.4)', progress: 'rgba(14, 165, 233, 0.8)' },
  green: { wave: 'rgba(34, 197, 94, 0.4)', progress: 'rgba(34, 197, 94, 0.8)' },
  gray: { wave: 'rgba(156, 163, 175, 0.4)', progress: 'rgba(156, 163, 175, 0.8)' },
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

    wavesurfer.on('error', (err) => {
      console.error('Waveform error:', err);
      setIsLoading(false);
    });

    wavesurfer.on('click', (relativeX) => {
      if (onSeek && duration > 0) {
        onSeek(relativeX * duration);
      }
    });

    wavesurfer.load(audioUrl);

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, height]);

  // Sync time with external audio
  useEffect(() => {
    if (wavesurferRef.current && isReady && duration > 0) {
      const progress = currentTime / duration;
      wavesurferRef.current.seekTo(Math.max(0, Math.min(1, progress)));
    }
  }, [currentTime, duration, isReady]);

  // Update colors when they change
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setOptions({
        waveColor: isMuted ? 'rgba(100, 100, 100, 0.2)' : colors.wave,
        progressColor: isMuted ? 'rgba(100, 100, 100, 0.4)' : colors.progress,
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
