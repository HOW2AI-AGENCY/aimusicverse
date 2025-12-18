/**
 * Waveform Canvas Component
 * Pure canvas-based waveform visualization
 */

import React, { memo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WaveformCanvasProps {
  waveformData: number[];
  progress?: number; // 0-1
  height?: number;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  className?: string;
  onClick?: (progress: number) => void;
}

export const WaveformCanvas = memo(function WaveformCanvas({
  waveformData,
  progress = 0,
  height = 48,
  barWidth = 3,
  barGap = 1,
  barRadius = 1,
  waveColor,
  progressColor,
  backgroundColor,
  className,
  onClick,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef<{ wave: string; progress: string; bg: string } | null>(null);

  // Get CSS colors on mount
  useEffect(() => {
    const getCSSColor = (varName: string, fallback: string): string => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      return value || fallback;
    };

    const mutedFg = getCSSColor('--muted-foreground', '240 3.8% 46.1%');
    const primary = getCSSColor('--primary', '217.2 91.2% 59.8%');
    const bg = getCSSColor('--background', '0 0% 0%');

    colorsRef.current = {
      wave: waveColor || `hsl(${mutedFg} / 0.4)`,
      progress: progressColor || `hsl(${primary})`,
      bg: backgroundColor || 'transparent',
    };
  }, [waveColor, progressColor, backgroundColor]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length || !colorsRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;
    const centerY = canvasHeight / 2;
    const maxBarHeight = canvasHeight * 0.9;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Calculate bar positions
    const totalBarWidth = barWidth + barGap;
    const barsCount = Math.min(waveformData.length, Math.floor(width / totalBarWidth));
    const startX = (width - barsCount * totalBarWidth) / 2;
    
    // Sample waveform data to match bar count
    const step = waveformData.length / barsCount;

    for (let i = 0; i < barsCount; i++) {
      const dataIndex = Math.floor(i * step);
      const value = waveformData[dataIndex] || 0;
      const barHeight = Math.max(2, value * maxBarHeight);
      const x = startX + i * totalBarWidth;
      const y = centerY - barHeight / 2;
      
      const barProgress = (x + barWidth / 2) / width;
      const isPassed = barProgress <= progress;
      
      ctx.fillStyle = isPassed ? colorsRef.current!.progress : colorsRef.current!.wave;
      
      // Draw rounded bar
      if (barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Draw progress indicator line
    if (progress > 0 && progress < 1) {
      const progressX = progress * width;
      ctx.fillStyle = colorsRef.current!.progress;
      ctx.fillRect(progressX - 1, 0, 2, canvasHeight);
    }
  }, [waveformData, progress, height, barWidth, barGap, barRadius]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    
    onClick(Math.max(0, Math.min(1, clickProgress)));
  }, [onClick]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'w-full',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ height }}
      onClick={handleClick}
    />
  );
});

export default WaveformCanvas;
