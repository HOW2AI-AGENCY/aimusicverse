/**
 * Mini Waveform Component for Reference Audio
 * Compact waveform visualization with playback progress
 */

import { useEffect, useRef, useState, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type WaveSurferCtor = typeof import('wavesurfer.js');
type WaveSurferInstance = any;

interface MiniWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  className?: string;
  height?: number;
}

export const MiniWaveform = memo(function MiniWaveform({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  className,
  height = 32,
}: MiniWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastSeekRef = useRef<number>(0);

  // Initialize WaveSurfer (lazy-load to avoid pulling vendor-audio into initial route)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!containerRef.current || !audioUrl) return;

      setIsLoading(true);
      setIsReady(false);

      const mod: WaveSurferCtor = await import('wavesurfer.js');
      const WaveSurfer = (mod as any).default ?? (mod as any);
      if (!mounted) return;

      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        height,
        waveColor: 'rgba(255, 255, 255, 0.3)',
        progressColor: 'hsl(var(--primary))',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
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

      wavesurfer.on('error', () => {
        if (!mounted) return;
        setIsLoading(false);
      });

      wavesurfer.on('click', (relativeX: number) => {
        if (onSeek && duration > 0) {
          const seekTime = relativeX * duration;
          lastSeekRef.current = seekTime;
          onSeek(seekTime);
        }
      });

      // Mute WaveSurfer's audio - we use external audio element
      wavesurfer.setMuted(true);
      wavesurfer.load(audioUrl);
    };

    init();

    return () => {
      mounted = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, height, duration, onSeek]);

  // Sync progress with external currentTime
  useEffect(() => {
    if (!wavesurferRef.current || !isReady || duration <= 0) return;
    
    // Avoid updating if we just sought
    const timeSinceSeek = Math.abs(currentTime - lastSeekRef.current);
    if (timeSinceSeek < 0.1) return;

    const progress = currentTime / duration;
    wavesurferRef.current.seekTo(Math.max(0, Math.min(1, progress)));
  }, [currentTime, duration, isReady]);

  return (
    <div className={cn("relative w-full", className)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded" style={{ height }} />
      )}
      <div
        ref={containerRef}
        className={cn(
          "w-full transition-opacity cursor-pointer",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        style={{ height }}
      />
    </div>
  );
});
