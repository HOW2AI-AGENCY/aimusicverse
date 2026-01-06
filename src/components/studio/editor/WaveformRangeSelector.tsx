/**
 * WaveformRangeSelector - Interactive waveform with draggable section boundaries
 * 
 * Features:
 * - Waveform visualization from audio URL
 * - Draggable start/end handles
 * - Visual feedback for selected range
 * - Click to seek within range
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { GripVertical } from 'lucide-react';

interface WaveformRangeSelectorProps {
  audioUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
  onPreviewSeek?: (time: number) => void;
  /** Called when range changes complete (on mouse/touch up) for lyrics sync */
  onRangeChangeComplete?: (start: number, end: number) => void;
  minDuration?: number;
  maxDuration?: number;
  height?: number;
  className?: string;
}

export function WaveformRangeSelector({
  audioUrl,
  duration,
  startTime,
  endTime,
  onRangeChange,
  onPreviewSeek,
  onRangeChangeComplete,
  minDuration = 5,
  maxDuration = 120,
  height = 80,
  className,
}: WaveformRangeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data from audio
  useEffect(() => {
    if (!audioUrl) return;
    
    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const data: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          data.push(sum / blockSize);
        }
        
        // Normalize with minimum visibility threshold
        const max = Math.max(...data, 0.001);
        const normalized = data.map(d => {
          const value = d / max;
          // Ensure minimum visibility (0.15) and boost low values
          return Math.max(0.15, Math.pow(value, 0.7));
        });
        setWaveformData(normalized);
        audioContext.close();
      } catch (error) {
        // Fallback to generated waveform
        const fallbackData = Array.from({ length: 200 }, (_, i) => {
          const base = 0.3;
          const variation = Math.sin(i * 0.1) * 0.2 + Math.cos(i * 0.2) * 0.15;
          return Math.max(0.1, Math.min(1, base + variation + Math.random() * 0.2));
        });
        setWaveformData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;
    const barWidth = width / waveformData.length;
    const startPercent = startTime / duration;
    const endPercent = endTime / duration;

    ctx.clearRect(0, 0, width, canvasHeight);

    // Get computed styles for colors
    const computedStyle = getComputedStyle(canvas);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim() || '262 83% 58%';
    const mutedFgColor = computedStyle.getPropertyValue('--muted-foreground').trim() || '240 5% 65%';

    // Draw selected range overlay first (background)
    const rangeStart = startPercent * width;
    const rangeEnd = endPercent * width;
    ctx.fillStyle = `hsla(${primaryColor}, 0.15)`;
    ctx.fillRect(rangeStart, 0, rangeEnd - rangeStart, canvasHeight);

    // Draw bars
    waveformData.forEach((value, i) => {
      const x = i * barWidth;
      const barHeight = value * (canvasHeight * 0.8);
      const y = (canvasHeight - barHeight) / 2;
      const percent = i / waveformData.length;
      
      // Check if bar is in selected range
      const inRange = percent >= startPercent && percent <= endPercent;
      
      if (inRange) {
        // Selected range - use primary color
        ctx.fillStyle = `hsl(${primaryColor})`;
      } else {
        // Outside range - muted
        ctx.fillStyle = `hsla(${mutedFgColor}, 0.3)`;
      }
      
      // Draw rounded rectangle manually for compatibility
      const barX = x + 1;
      const barW = Math.max(1, barWidth - 2);
      const radius = Math.min(2, barW / 2);
      
      ctx.beginPath();
      ctx.moveTo(barX + radius, y);
      ctx.lineTo(barX + barW - radius, y);
      ctx.quadraticCurveTo(barX + barW, y, barX + barW, y + radius);
      ctx.lineTo(barX + barW, y + barHeight - radius);
      ctx.quadraticCurveTo(barX + barW, y + barHeight, barX + barW - radius, y + barHeight);
      ctx.lineTo(barX + radius, y + barHeight);
      ctx.quadraticCurveTo(barX, y + barHeight, barX, y + barHeight - radius);
      ctx.lineTo(barX, y + radius);
      ctx.quadraticCurveTo(barX, y, barX + radius, y);
      ctx.closePath();
      ctx.fill();
    });

  }, [waveformData, startTime, endTime, duration]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    
    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(time, endTime - minDuration));
      const rangeDuration = endTime - newStart;
      if (rangeDuration <= maxDuration) {
        onRangeChange(newStart, endTime);
      }
    } else {
      const newEnd = Math.min(duration, Math.max(time, startTime + minDuration));
      const rangeDuration = newEnd - startTime;
      if (rangeDuration <= maxDuration) {
        onRangeChange(startTime, newEnd);
      }
    }
  }, [isDragging, duration, startTime, endTime, minDuration, maxDuration, onRangeChange]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Notify when drag completes for lyrics sync
      onRangeChangeComplete?.(startTime, endTime);
    }
    setIsDragging(null);
  }, [isDragging, startTime, endTime, onRangeChangeComplete]);

  // Attach global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent, handle: 'start' | 'end') => {
    e.preventDefault();
    setIsDragging(handle);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    
    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(time, endTime - minDuration));
      const rangeDuration = endTime - newStart;
      if (rangeDuration <= maxDuration) {
        onRangeChange(newStart, endTime);
      }
    } else {
      const newEnd = Math.min(duration, Math.max(time, startTime + minDuration));
      const rangeDuration = newEnd - startTime;
      if (rangeDuration <= maxDuration) {
        onRangeChange(startTime, newEnd);
      }
    }
  }, [isDragging, duration, startTime, endTime, minDuration, maxDuration, onRangeChange]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      // Notify when drag completes for lyrics sync
      onRangeChangeComplete?.(startTime, endTime);
    }
    setIsDragging(null);
  }, [isDragging, startTime, endTime, onRangeChangeComplete]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Click to seek
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !onPreviewSeek) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;
    
    // Only seek if within selected range
    if (time >= startTime && time <= endTime) {
      onPreviewSeek(time);
    }
  }, [duration, startTime, endTime, onPreviewSeek]);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const sectionDuration = endTime - startTime;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Time labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
        <span>{formatTime(startTime)}</span>
        <span className="text-foreground font-medium">
          {sectionDuration.toFixed(1)}с
        </span>
        <span>{formatTime(endTime)}</span>
      </div>
      
      {/* Waveform container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative rounded-xl overflow-hidden bg-muted/30 border border-border/50",
          isDragging && "ring-2 ring-primary/50"
        )}
        style={{ height }}
        onClick={handleClick}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-8 bg-primary/30 rounded-full"
                  animate={{ scaleY: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Canvas for waveform */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
            
            {/* Start handle - larger touch target for mobile */}
            <motion.div
              className={cn(
                "absolute top-0 bottom-0 w-8 cursor-ew-resize z-10",
                "flex items-center justify-center touch-none",
                isDragging === 'start' && "z-20"
              )}
              style={{ left: `calc(${startPercent}% - 16px)` }}
              onMouseDown={(e) => handleMouseDown(e, 'start')}
              onTouchStart={(e) => handleTouchStart(e, 'start')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn(
                "w-2 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 transition-all",
                "flex items-center justify-center border-2 border-primary-foreground/30",
                isDragging === 'start' && "w-2.5 bg-primary scale-110"
              )}>
                <GripVertical className="w-4 h-4 text-primary-foreground drop-shadow-md" />
              </div>
            </motion.div>
            
            {/* End handle - larger touch target for mobile */}
            <motion.div
              className={cn(
                "absolute top-0 bottom-0 w-8 cursor-ew-resize z-10",
                "flex items-center justify-center touch-none",
                isDragging === 'end' && "z-20"
              )}
              style={{ left: `calc(${endPercent}% - 16px)` }}
              onMouseDown={(e) => handleMouseDown(e, 'end')}
              onTouchStart={(e) => handleTouchStart(e, 'end')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn(
                "w-2 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 transition-all",
                "flex items-center justify-center border-2 border-primary-foreground/30",
                isDragging === 'end' && "w-2.5 bg-primary scale-110"
              )}>
                <GripVertical className="w-4 h-4 text-primary-foreground drop-shadow-md" />
              </div>
            </motion.div>
          </>
        )}
      </div>
      
      {/* Duration validation */}
      {sectionDuration > maxDuration && (
        <p className="text-xs text-destructive text-center">
          Секция слишком длинная (макс. {maxDuration}с)
        </p>
      )}
      {sectionDuration < minDuration && (
        <p className="text-xs text-destructive text-center">
          Секция слишком короткая (мин. {minDuration}с)
        </p>
      )}
    </div>
  );
}
