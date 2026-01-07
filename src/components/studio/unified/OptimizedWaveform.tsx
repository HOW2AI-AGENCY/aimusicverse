/**
 * OptimizedWaveform - High-performance waveform visualization
 * Uses canvas for rendering and caches peak data
 */

import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWaveformCache } from '@/hooks/studio/useWaveformCache';
import { useWaveformWorker } from '@/hooks/studio/useWaveformWorker';

interface OptimizedWaveformProps {
  audioUrl: string;
  audioId: string;
  progress?: number; // 0-1
  height?: number;
  className?: string;
  primaryColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  onClick?: (progress: number) => void;
}

const TARGET_PEAKS = 200;

export const OptimizedWaveform = memo(function OptimizedWaveform({
  audioUrl,
  audioId,
  progress = 0,
  height = 64,
  className,
  primaryColor = 'hsl(var(--muted-foreground))',
  progressColor = 'hsl(var(--primary))',
  backgroundColor = 'transparent',
  onClick,
}: OptimizedWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peaksRef = useRef<number[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const lastProgressRef = useRef<number>(-1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { get: getCached, set: setCached } = useWaveformCache();
  const { generatePeaks } = useWaveformWorker();

  // Draw waveform on canvas
  const draw = useCallback((peaks: number[], currentProgress: number) => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const { width, height: canvasHeight } = canvas.getBoundingClientRect();
    
    // Set canvas size for high DPI
    if (canvas.width !== width * dpr || canvas.height !== canvasHeight * dpr) {
      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, canvasHeight);
    
    const barWidth = width / peaks.length;
    const halfHeight = canvasHeight / 2;
    const progressX = currentProgress * width;
    
    // Draw bars
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = Math.max(2, peak * halfHeight * 0.9);
      const isPast = x < progressX;
      
      ctx.fillStyle = isPast ? progressColor : primaryColor;
      ctx.fillRect(
        x,
        halfHeight - barHeight,
        Math.max(1, barWidth - 1),
        barHeight * 2
      );
    });
  }, [backgroundColor, primaryColor, progressColor]);

  // Load and generate peaks
  useEffect(() => {
    let cancelled = false;
    
    async function loadPeaks() {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cached = await getCached(audioId);
      if (cached && !cancelled) {
        peaksRef.current = cached.peaks;
        setIsLoading(false);
        draw(cached.peaks, progress);
        return;
      }
      
      try {
        // Fetch audio and decode
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('Failed to fetch audio');
        
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        if (cancelled) {
          audioContext.close();
          return;
        }
        
        // Generate peaks using worker
        const channelData = audioBuffer.getChannelData(0);
        const peaks = await generatePeaks(channelData, TARGET_PEAKS);
        
        audioContext.close();
        
        if (cancelled) return;
        
        // Cache the result
        await setCached(audioId, peaks, audioBuffer.duration);
        
        peaksRef.current = peaks;
        setIsLoading(false);
        draw(peaks, progress);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load waveform');
          setIsLoading(false);
        }
      }
    }
    
    loadPeaks();
    
    return () => {
      cancelled = true;
    };
  }, [audioUrl, audioId, getCached, setCached, generatePeaks, draw, progress]);

  // Update progress efficiently
  useEffect(() => {
    if (Math.abs(progress - lastProgressRef.current) < 0.001) return;
    lastProgressRef.current = progress;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      draw(peaksRef.current, progress);
    });
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [progress, draw]);

  // Handle click for seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, x / rect.width));
    onClick(newProgress);
  }, [onClick]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver(() => {
      draw(peaksRef.current, progress);
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw, progress]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full cursor-pointer select-none',
        className
      )}
      style={{ height }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
});
