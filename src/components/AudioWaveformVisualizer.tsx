import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getWaveform, saveWaveform } from '@/lib/waveformCache';

interface AudioWaveformVisualizerProps {
  audioUrl?: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: number;
}

// Get actual CSS color value from CSS variable with proper comma syntax
const getCSSColor = (cssVar: string, fallback: string): string => {
  if (typeof window === 'undefined') return `hsl(${fallback})`;
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const value = computed.getPropertyValue(cssVar).trim();
  if (!value) return `hsl(${fallback})`;
  // Convert space-separated HSL to comma-separated for canvas compatibility
  const parts = value.split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return `hsl(${value})`;
};

// Convert hsl() to hsla() with alpha
const toHsla = (hslColor: string, alpha: number): string => {
  // Match hsl(h, s%, l%) format
  const match = hslColor.match(/hsl\(([^)]+)\)/);
  if (match) {
    return `hsla(${match[1]}, ${alpha})`;
  }
  return hslColor;
};

export function AudioWaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  className,
  height = 96, // Default h-24
}: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const colorsRef = useRef<{ primary: string; muted: string } | null>(null);

  // Get colors once on mount
  useEffect(() => {
    colorsRef.current = {
      primary: getCSSColor('--primary', '220 90% 56%'),
      muted: getCSSColor('--muted-foreground', '220 9% 46%')
    };
  }, []);

  // Generate waveform data from audio with persistent caching
  useEffect(() => {
    if (!audioUrl) return;

    const loadOrGenerateWaveform = async () => {
      // Check persistent cache first (IndexedDB + memory)
      const cached = await getWaveform(audioUrl);
      if (cached) {
        setWaveformData(cached);
        return;
      }

      setIsLoading(true);
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported');
        }
        const audioContext = new AudioContextClass();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 100;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        // Optimized sampling - take max for better visual
        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let max = 0;
          for (let j = 0; j < blockSize; j += 4) {
            const val = Math.abs(rawData[blockStart + j]);
            if (val > max) max = val;
          }
          filteredData.push(max);
        }

        // Normalize data
        const maxVal = Math.max(...filteredData);
        const normalizedData = filteredData.map((n) => maxVal > 0 ? n / maxVal : 0);

        // Save to persistent cache (IndexedDB + memory)
        await saveWaveform(audioUrl, normalizedData);
        setWaveformData(normalizedData);
        
        // Close audio context to free resources
        audioContext.close();
      } catch (error) {
        logger.error('Error generating waveform', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrGenerateWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas with proper colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height: canvasHeight } = canvas.getBoundingClientRect();

    canvas.width = width * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    const barWidth = Math.max(1, width / waveformData.length - 1);
    const barGap = 1;
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = width * progress;

    // Get colors
    const primaryColor = colorsRef.current?.primary || 'hsl(220, 90%, 56%)';
    const mutedColor = colorsRef.current?.muted || 'hsl(220, 9%, 46%)';

    waveformData.forEach((value, index) => {
      const barHeight = Math.max(2, value * canvasHeight * 0.85);
      const x = index * (barWidth + barGap);
      const y = (canvasHeight - barHeight) / 2;

      const isPassed = x < progressX;
      
      if (isPassed) {
        // Played section - primary color with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.5, primaryColor);
        gradient.addColorStop(1, toHsla(primaryColor, 0.7));
        ctx.fillStyle = gradient;
      } else {
        // Unplayed section - muted color with transparency
        ctx.fillStyle = toHsla(mutedColor, 0.3);
      }

      // Draw rounded bar
      const radius = Math.min(barWidth / 2, 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    });

    // Draw progress indicator line with glow
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, canvasHeight);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [waveformData, currentTime, duration, isPlaying]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    const seekTime = clickProgress * duration;

    onSeek(seekTime);
  };

  if (isLoading) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: `${height}px` }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={cn(
        'w-full cursor-pointer hover:opacity-80 transition-opacity rounded-lg',
        className
      )}
      style={{ height: `${height}px`, display: 'block' }}
    />
  );
}
