/**
 * OptimizedStemWaveform - Lightweight canvas-based waveform
 * 
 * Unlike WaveSurfer-based version, this uses pre-computed peaks
 * and renders with Canvas2D for minimal overhead.
 * 
 * Benefits:
 * - No audio re-download (uses cached waveform data)
 * - Instant rendering with Canvas
 * - Minimal memory footprint
 * - Smooth playhead updates at 60fps
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getWaveform, saveWaveform } from '@/lib/waveformCache';
import { logger } from '@/lib/logger';

interface OptimizedStemWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  color?: string;
  height?: number;
  onSeek?: (time: number) => void;
}

// Color map for stem types
const colorMap: Record<string, { wave: string; progress: string; bg: string }> = {
  blue: { wave: 'rgba(59, 130, 246, 0.3)', progress: 'rgba(59, 130, 246, 0.8)', bg: 'rgba(59, 130, 246, 0.1)' },
  cyan: { wave: 'rgba(6, 182, 212, 0.3)', progress: 'rgba(6, 182, 212, 0.8)', bg: 'rgba(6, 182, 212, 0.1)' },
  orange: { wave: 'rgba(249, 115, 22, 0.3)', progress: 'rgba(249, 115, 22, 0.8)', bg: 'rgba(249, 115, 22, 0.1)' },
  purple: { wave: 'rgba(168, 85, 247, 0.3)', progress: 'rgba(168, 85, 247, 0.8)', bg: 'rgba(168, 85, 247, 0.1)' },
  amber: { wave: 'rgba(245, 158, 11, 0.3)', progress: 'rgba(245, 158, 11, 0.8)', bg: 'rgba(245, 158, 11, 0.1)' },
  pink: { wave: 'rgba(236, 72, 153, 0.3)', progress: 'rgba(236, 72, 153, 0.8)', bg: 'rgba(236, 72, 153, 0.1)' },
  emerald: { wave: 'rgba(16, 185, 129, 0.3)', progress: 'rgba(16, 185, 129, 0.8)', bg: 'rgba(16, 185, 129, 0.1)' },
  yellow: { wave: 'rgba(234, 179, 8, 0.3)', progress: 'rgba(234, 179, 8, 0.8)', bg: 'rgba(234, 179, 8, 0.1)' },
  lime: { wave: 'rgba(132, 204, 22, 0.3)', progress: 'rgba(132, 204, 22, 0.8)', bg: 'rgba(132, 204, 22, 0.1)' },
  red: { wave: 'rgba(239, 68, 68, 0.3)', progress: 'rgba(239, 68, 68, 0.8)', bg: 'rgba(239, 68, 68, 0.1)' },
  violet: { wave: 'rgba(139, 92, 246, 0.3)', progress: 'rgba(139, 92, 246, 0.8)', bg: 'rgba(139, 92, 246, 0.1)' },
  teal: { wave: 'rgba(20, 184, 166, 0.3)', progress: 'rgba(20, 184, 166, 0.8)', bg: 'rgba(20, 184, 166, 0.1)' },
  sky: { wave: 'rgba(14, 165, 233, 0.3)', progress: 'rgba(14, 165, 233, 0.8)', bg: 'rgba(14, 165, 233, 0.1)' },
  green: { wave: 'rgba(34, 197, 94, 0.3)', progress: 'rgba(34, 197, 94, 0.8)', bg: 'rgba(34, 197, 94, 0.1)' },
  gray: { wave: 'rgba(107, 114, 128, 0.3)', progress: 'rgba(107, 114, 128, 0.8)', bg: 'rgba(107, 114, 128, 0.1)' },
  // Stem type mappings
  vocals: { wave: 'rgba(59, 130, 246, 0.3)', progress: 'rgba(59, 130, 246, 0.8)', bg: 'rgba(59, 130, 246, 0.1)' },
  vocal: { wave: 'rgba(59, 130, 246, 0.3)', progress: 'rgba(59, 130, 246, 0.8)', bg: 'rgba(59, 130, 246, 0.1)' },
  instrumental: { wave: 'rgba(168, 85, 247, 0.3)', progress: 'rgba(168, 85, 247, 0.8)', bg: 'rgba(168, 85, 247, 0.1)' },
  drums: { wave: 'rgba(249, 115, 22, 0.3)', progress: 'rgba(249, 115, 22, 0.8)', bg: 'rgba(249, 115, 22, 0.1)' },
  bass: { wave: 'rgba(16, 185, 129, 0.3)', progress: 'rgba(16, 185, 129, 0.8)', bg: 'rgba(16, 185, 129, 0.1)' },
  guitar: { wave: 'rgba(245, 158, 11, 0.3)', progress: 'rgba(245, 158, 11, 0.8)', bg: 'rgba(245, 158, 11, 0.1)' },
  piano: { wave: 'rgba(139, 92, 246, 0.3)', progress: 'rgba(139, 92, 246, 0.8)', bg: 'rgba(139, 92, 246, 0.1)' },
  keyboard: { wave: 'rgba(139, 92, 246, 0.3)', progress: 'rgba(139, 92, 246, 0.8)', bg: 'rgba(139, 92, 246, 0.1)' },
  other: { wave: 'rgba(107, 114, 128, 0.3)', progress: 'rgba(107, 114, 128, 0.8)', bg: 'rgba(107, 114, 128, 0.1)' },
};

const SAMPLES = 100; // Number of bars to render
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const BAR_RADIUS = 1;

/**
 * Generate peaks from audio URL (web audio API)
 */
async function generatePeaksFromUrl(url: string, samples: number): Promise<number[]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();
  
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const peaks: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }
  
  // Normalize
  const maxPeak = Math.max(...peaks, 0.01);
  return peaks.map(p => p / maxPeak);
}

export const OptimizedStemWaveform = memo(({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  color = 'blue',
  height = 40,
  onSeek,
}: OptimizedStemWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rafRef = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);
  
  const colors = colorMap[color.toLowerCase()] || colorMap.blue;
  
  // Load waveform data (from cache or generate)
  useEffect(() => {
    let mounted = true;
    
    const loadPeaks = async () => {
      if (!audioUrl) return;
      
      setIsLoading(true);
      
      try {
        // Try cache first
        const cached = await getWaveform(audioUrl);
        if (cached && cached.length > 0) {
          if (mounted) {
            setPeaks(cached);
            setIsLoading(false);
          }
          return;
        }
        
        // Generate peaks
        const newPeaks = await generatePeaksFromUrl(audioUrl, SAMPLES);
        
        if (mounted) {
          setPeaks(newPeaks);
          setIsLoading(false);
          // Cache in background
          saveWaveform(audioUrl, newPeaks).catch(() => {});
        }
      } catch (error) {
        logger.error('Failed to load waveform peaks', error);
        if (mounted) {
          // Fallback: generate placeholder peaks
          setPeaks(Array.from({ length: SAMPLES }, () => Math.random() * 0.5 + 0.2));
          setIsLoading(false);
        }
      }
    };
    
    loadPeaks();
    
    return () => {
      mounted = false;
    };
  }, [audioUrl]);
  
  // Draw waveform
  const drawWaveform = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaks) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const canvasHeight = height;
    
    // Set canvas size (only if changed)
    if (canvas.width !== width * dpr || canvas.height !== canvasHeight * dpr) {
      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.scale(dpr, dpr);
    }
    
    // Clear
    ctx.clearRect(0, 0, width, canvasHeight);
    
    // Calculate bar positions
    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const barsCount = Math.min(peaks.length, Math.floor(width / totalBarWidth));
    const startX = (width - barsCount * totalBarWidth) / 2;
    const progressX = startX + progress * barsCount * totalBarWidth;
    
    // Draw bars
    for (let i = 0; i < barsCount; i++) {
      const peakIndex = Math.floor(i * peaks.length / barsCount);
      const peakValue = peaks[peakIndex];
      const barHeight = Math.max(2, peakValue * (canvasHeight - 4));
      const x = startX + i * totalBarWidth;
      const y = (canvasHeight - barHeight) / 2;
      
      // Choose color based on progress
      const isPast = x < progressX;
      ctx.fillStyle = isMuted 
        ? 'rgba(107, 114, 128, 0.2)' 
        : isPast ? colors.progress : colors.wave;
      
      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, barHeight, BAR_RADIUS);
      ctx.fill();
    }
  }, [peaks, height, colors, isMuted]);
  
  // Animation loop for smooth playhead
  useEffect(() => {
    if (!peaks) return;
    
    const animate = () => {
      const progress = duration > 0 ? currentTime / duration : 0;
      
      // Only redraw if progress changed significantly or mute state changed
      if (Math.abs(progress - lastProgressRef.current) > 0.001 || isPlaying) {
        lastProgressRef.current = progress;
        drawWaveform(progress);
      }
      
      if (isPlaying) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Initial draw
    drawWaveform(duration > 0 ? currentTime / duration : 0);
    
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [peaks, currentTime, duration, isPlaying, drawWaveform]);
  
  // Redraw on mute change
  useEffect(() => {
    if (peaks) {
      drawWaveform(duration > 0 ? currentTime / duration : 0);
    }
  }, [isMuted, peaks, drawWaveform, currentTime, duration]);
  
  // Handle click to seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current || duration <= 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    onSeek(Math.max(0, Math.min(duration, progress * duration)));
  }, [onSeek, duration]);
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full cursor-pointer transition-opacity",
        isMuted && "opacity-50"
      )}
      style={{ height }}
      onClick={handleClick}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded" style={{ height }} />
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full transition-opacity",
          isLoading && "opacity-0"
        )}
      />
    </div>
  );
});

OptimizedStemWaveform.displayName = 'OptimizedStemWaveform';
