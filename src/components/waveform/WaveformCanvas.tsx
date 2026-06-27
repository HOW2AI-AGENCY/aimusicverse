/**
 * Waveform Canvas Component
 * Pure canvas-based waveform visualization
 */

import React, { memo, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

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
  const sizeRef = useRef<{ cssW: number; cssH: number; dpr: number }>({ cssW: 0, cssH: 0, dpr: 0 });

  // Get CSS colors on mount / when overrides change.
  useEffect(() => {
    const getCSSColor = (varName: string, fallback: string): string => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || fallback;
    };

    const primary = getCSSColor("--primary", "217.2 91.2% 59.8%");
    const isDark = document.documentElement.classList.contains("dark");
    const waveOpacity = isDark ? 0.55 : 0.4;

    colorsRef.current = {
      wave: waveColor || `hsl(${primary} / ${waveOpacity})`,
      progress: progressColor || `hsl(${primary})`,
      bg: backgroundColor || "transparent",
    };
  }, [waveColor, progressColor, backgroundColor]);

  // Resize canvas backing store only when the element's CSS size or DPR
  // actually changes. Mutating canvas.width on every progress tick clears the
  // bitmap and is the root cause of the mobile flicker.
  const ensureCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const prev = sizeRef.current;
    if (prev.cssW === cssW && prev.cssH === cssH && prev.dpr === dpr) return false;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    sizeRef.current = { cssW, cssH, dpr };
    return true;
  }, []);

  // Observe size changes — single source of truth for the bitmap dimensions.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ensureCanvasSize();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      // ensureCanvasSize is no-op when nothing changed; cheap to call.
      ensureCanvasSize();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [ensureCanvasSize]);

  // Draw waveform — runs on data/progress/style changes, never resizes the
  // canvas on its own (resize is handled by the effect above). The result is
  // a stable bitmap on mobile while the playhead advances.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length || !colorsRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Make sure the backing store matches the current CSS size before drawing.
    ensureCanvasSize();
    const { cssW: width, cssH: canvasHeight, dpr } = sizeRef.current;
    if (width === 0 || canvasHeight === 0) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerY = canvasHeight / 2;
    const maxBarHeight = canvasHeight * 0.9;

    ctx.clearRect(0, 0, width, canvasHeight);

    const totalBarWidth = barWidth + barGap;
    const barsCount = Math.min(waveformData.length, Math.floor(width / totalBarWidth));
    const startX = (width - barsCount * totalBarWidth) / 2;
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

      if (barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    if (progress > 0 && progress < 1) {
      const progressX = progress * width;
      ctx.fillStyle = colorsRef.current!.progress;
      ctx.fillRect(progressX - 1, 0, 2, canvasHeight);
    }
  }, [waveformData, progress, height, barWidth, barGap, barRadius, ensureCanvasSize]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onClick) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickProgress = x / rect.width;

      onClick(Math.max(0, Math.min(1, clickProgress)));
    },
    [onClick],
  );

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full", onClick && "cursor-pointer", className)}
      style={{ height }}
      onClick={handleClick}
    />
  );
});

export default WaveformCanvas;
