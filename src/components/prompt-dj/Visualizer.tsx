/**
 * Visualizer - RAF-based audio visualizer with offscreen rendering
 * Uses requestAnimationFrame and canvas optimization for smooth 60fps
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { cn } from '@/lib/utils';

interface VisualizerProps {
  analyzerNode: Tone.Analyser | null;
  isActive: boolean;
  className?: string;
  variant?: 'bars' | 'wave' | 'circular';
  barCount?: number;
}

export const Visualizer = memo(function Visualizer({
  analyzerNode,
  isActive,
  className,
  variant = 'bars',
  barCount = 32,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const smoothedDataRef = useRef<Float32Array | null>(null);

  // Smoothing factor for visual interpolation
  const SMOOTHING = 0.7;
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  const drawBars = useCallback((
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number
  ) => {
    const barWidth = width / barCount;
    const step = Math.floor(data.length / barCount);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      // Get average of frequency band
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += data[i * step + j] || 0;
      }
      const value = sum / step;

      // Normalize to 0-1 range (data is in dB, typically -100 to 0)
      const normalized = Math.max(0, (value + 100) / 100);
      const barHeight = normalized * height * 0.9;

      // Gradient based on height
      const hue = 270 - (normalized * 60); // Purple to pink
      const saturation = 70 + (normalized * 30);
      const lightness = 40 + (normalized * 20);

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Rounded top
      const radius = barWidth * 0.3;
      ctx.beginPath();
      ctx.roundRect(x + 1, y, barWidth - 2, barHeight, [radius, radius, 0, 0]);
      ctx.fill();
    }
  }, [barCount]);

  const drawWave = useCallback((
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'hsl(270, 70%, 50%)');
    gradient.addColorStop(0.5, 'hsl(330, 70%, 50%)');
    gradient.addColorStop(1, 'hsl(270, 70%, 50%)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const normalized = Math.max(0, (data[i] + 100) / 100);
      const y = (1 - normalized) * height * 0.5 + height * 0.25;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!isActive || !analyzerNode || !canvasRef.current) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    // Throttle to target FPS
    const elapsed = timestamp - lastFrameTimeRef.current;
    if (elapsed < FRAME_INTERVAL) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    // Get frequency data
    const rawData = analyzerNode.getValue() as Float32Array;

    // Initialize or update smoothed data
    if (!smoothedDataRef.current || smoothedDataRef.current.length !== rawData.length) {
      smoothedDataRef.current = new Float32Array(rawData);
    } else {
      // Apply exponential smoothing
      for (let i = 0; i < rawData.length; i++) {
        smoothedDataRef.current[i] = 
          smoothedDataRef.current[i] * SMOOTHING + rawData[i] * (1 - SMOOTHING);
      }
    }

    // Draw based on variant
    if (variant === 'bars') {
      drawBars(ctx, smoothedDataRef.current, canvas.width, canvas.height);
    } else if (variant === 'wave') {
      drawWave(ctx, smoothedDataRef.current, canvas.width, canvas.height);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [isActive, analyzerNode, variant, drawBars, drawWave]);

  // Start/stop animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Set canvas size with device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'w-full h-full',
        !isActive && 'opacity-30',
        className
      )}
      style={{ width: '100%', height: '100%' }}
    />
  );
});
