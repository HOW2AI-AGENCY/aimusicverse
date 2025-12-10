import { useEffect, useRef, useMemo, useCallback } from 'react';

interface AudioWaveformProps {
  waveformData: number[];
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
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

export function AudioWaveform({ 
  waveformData, 
  currentTime, 
  duration, 
  onSeek, 
  className = '',
  height = 12 // Default height matching fallback progress bar
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef<{ primary: string; muted: string } | null>(null);
  
  // Cache the waveform data to prevent re-generation
  const cachedWaveformData = useMemo(() => waveformData, [waveformData]);

  // Get colors once on mount
  useEffect(() => {
    colorsRef.current = {
      primary: getCSSColor('--primary', '220 90% 56%'),
      muted: getCSSColor('--muted-foreground', '220 9% 46%')
    };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(Math.max(0, Math.min(duration, seekTime)));
  }, [onSeek, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cachedWaveformData || cachedWaveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;
    const barWidth = Math.max(1, width / cachedWaveformData.length - 1);
    const barGap = 1;
    const centerY = canvasHeight / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Calculate progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = width * progress;

    // Get colors
    const primaryColor = colorsRef.current?.primary || 'hsl(220, 90%, 56%)';
    const mutedColor = colorsRef.current?.muted || 'hsl(220, 9%, 46%)';

    // Draw waveform bars
    cachedWaveformData.forEach((value, index) => {
      const barHeight = Math.max(2, value * canvasHeight * 0.9);
      const x = index * (barWidth + barGap);
      const y = centerY - barHeight / 2;

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
      const radius = Math.min(barWidth / 2, 1);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    });

    // Draw progress indicator line with glow
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, canvasHeight);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [cachedWaveformData, currentTime, duration]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg ${onSeek ? 'cursor-pointer' : ''} ${className}`}
      style={{ height: `${height}px` }}
      onClick={handleCanvasClick}
    />
  );
}
