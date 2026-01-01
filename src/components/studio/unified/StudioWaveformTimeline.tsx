/**
 * Studio Waveform Timeline
 * Main waveform display with playhead and seek functionality
 * Touch-optimized for mobile devices
 */

import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { logger } from '@/lib/logger';

interface StudioWaveformTimelineProps {
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  height?: number;
  className?: string;
}

// Dynamic import type for wavesurfer
type WaveSurferCtor = { default: any } | { create: any };
type WaveSurferInstance = {
  on: (event: string, callback: (data?: any) => void) => void;
  load: (url: string) => void;
  destroy: () => void;
  getDuration: () => number;
};

export const StudioWaveformTimeline = memo(function StudioWaveformTimeline({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  height = 80,
  className,
}: StudioWaveformTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Initialize WaveSurfer
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!waveformRef.current || !audioUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);

      try {
        const mod: WaveSurferCtor = await import('wavesurfer.js');
        const WaveSurfer = (mod as any).default ?? (mod as any);
        if (!mounted) return;

        // Clean up previous instance
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          height: height - 24, // Leave space for time markers
          waveColor: 'hsl(var(--primary) / 0.3)',
          progressColor: 'hsl(var(--primary) / 0.7)',
          barWidth: isMobile ? 3 : 2,
          barGap: 1,
          barRadius: 2,
          cursorWidth: 0,
          normalize: true,
          backend: 'WebAudio',
          interact: false,
          hideScrollbar: true,
          fillParent: true,
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
          if (!mounted) return;
          setIsReady(true);
          setIsLoading(false);
        });

        wavesurfer.on('error', (err: any) => {
          if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
            return;
          }
          logger.error('Waveform error', err);
          if (mounted) setIsLoading(false);
        });

        wavesurfer.load(audioUrl);
      } catch (e) {
        logger.error('Failed to init WaveSurfer', e);
        if (mounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch {}
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, height, isMobile]);

  // Calculate seek time from position
  const getSeekTimeFromPosition = useCallback((clientX: number): number => {
    if (!containerRef.current || duration <= 0) return 0;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = x / rect.width;
    return Math.max(0, Math.min(duration, percentage * duration));
  }, [duration]);

  // Handle click to seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const time = getSeekTimeFromPosition(e.clientX);
    haptic.select();
    onSeek(time);
  }, [getSeekTimeFromPosition, onSeek, haptic]);

  // Touch handlers for mobile seeking
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    
    setIsSeeking(true);
    haptic.select();
    
    const touch = e.touches[0];
    const time = getSeekTimeFromPosition(touch.clientX);
    onSeek(time);
  }, [duration, getSeekTimeFromPosition, onSeek, haptic]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSeeking || !containerRef.current || duration <= 0) return;
    
    const touch = e.touches[0];
    const time = getSeekTimeFromPosition(touch.clientX);
    onSeek(time);
  }, [isSeeking, duration, getSeekTimeFromPosition, onSeek]);

  const handleTouchEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  // Time markers
  const timeMarkers = [];
  const markerInterval = duration > 120 ? 30 : duration > 60 ? 15 : 10;
  for (let t = 0; t <= duration; t += markerInterval) {
    timeMarkers.push(t);
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative cursor-pointer select-none touch-manipulation",
        "bg-gradient-to-b from-muted/20 to-transparent rounded-lg overflow-hidden",
        className
      )}
      style={{ height }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Time markers at top */}
      <div className="absolute top-0 left-0 right-0 h-5 flex items-end px-1 z-10 pointer-events-none">
        {timeMarkers.map((time) => (
          <div
            key={time}
            className="absolute flex flex-col items-center"
            style={{ left: `${(time / duration) * 100}%` }}
          >
            <span className={cn(
              "font-mono text-muted-foreground",
              isMobile ? "text-[10px]" : "text-[9px]"
            )}>
              {formatTime(time)}
            </span>
            <div className="w-px h-1 bg-border/50" />
          </div>
        ))}
      </div>

      {/* Waveform container */}
      <div 
        ref={waveformRef} 
        className="absolute left-0 right-0 bottom-0"
        style={{ top: 20 }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="flex items-end gap-0.5 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* No audio state */}
      {!audioUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Нет аудио для отображения
          </span>
        </div>
      )}

      {/* Progress overlay */}
      {isReady && (
        <div 
          className="absolute top-5 bottom-0 left-0 bg-primary/10 pointer-events-none transition-all"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Playhead - wider on mobile for touch */}
      {isReady && (
        <div
          className={cn(
            "absolute top-0 bottom-0 bg-primary z-20 pointer-events-none shadow-lg",
            isMobile ? "w-1" : "w-0.5"
          )}
          style={{ left: `${progress}%` }}
        >
          <div className={cn(
            "absolute -top-0.5 left-1/2 -translate-x-1/2 bg-primary rounded-full shadow",
            isMobile ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
          )} />
        </div>
      )}

      {/* Current time display */}
      {isReady && (
        <div 
          className={cn(
            "absolute bottom-1 rounded bg-primary/90 text-primary-foreground font-mono pointer-events-none z-30",
            isMobile ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
          )}
          style={{ 
            left: `${Math.min(progress, 90)}%`,
            transform: progress > 90 ? 'translateX(-100%)' : 'translateX(-50%)'
          }}
        >
          {formatTime(currentTime)}
        </div>
      )}
    </div>
  );
});
