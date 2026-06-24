/**
 * RecordingVisualizer - Real-time audio level and waveform visualization
 */

import React, { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface RecordingVisualizerProps {
  audioLevel: number; // 0-100
  waveformData?: number[];
  isRecording: boolean;
  isPaused?: boolean;
  variant?: 'bars' | 'waveform' | 'combined';
  barCount?: number;
  height?: number;
  className?: string;
}

export const RecordingVisualizer = memo(function RecordingVisualizer({
  audioLevel,
  waveformData = [],
  isRecording,
  isPaused = false,
  variant = 'bars',
  barCount = 16,
  height = 64,
  className,
}: RecordingVisualizerProps) {
  // Generate bar heights based on audio level with some randomization
  const barHeights = useMemo(() => {
    if (!isRecording || isPaused) {
      return Array(barCount).fill(0.1);
    }

    const baseLevel = audioLevel / 100;
    return Array(barCount).fill(0).map((_, i) => {
      // Create a wave pattern
      const waveOffset = Math.sin((i / barCount) * Math.PI * 2 + Date.now() / 200) * 0.2;
      const randomness = (Math.random() - 0.5) * 0.15;
      const value = baseLevel + waveOffset + randomness;
      return Math.max(0.1, Math.min(1, value));
    });
  }, [audioLevel, isRecording, isPaused, barCount]);

  // Get color based on level
  const getLevelColor = (level: number) => {
    if (level > 80) return 'bg-destructive';
    if (level > 60) return 'bg-yellow-500';
    return 'bg-primary';
  };

  if (variant === 'waveform' && waveformData.length > 0) {
    return (
      <div 
        className={cn('flex items-center justify-center gap-px overflow-hidden', className)}
        style={{ height }}
      >
        {waveformData.slice(-100).map((value, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-primary/60"
            initial={{ height: 4 }}
            animate={{ height: Math.max(4, value * height * 0.9) }}
            transition={{ duration: 0.05 }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'combined') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* VU Meter Bars */}
        <div 
          className="flex items-end justify-center gap-1"
          style={{ height: height * 0.6 }}
        >
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              className={cn(
                'w-2 rounded-t-sm transition-colors',
                getLevelColor(audioLevel)
              )}
              animate={{ 
                height: h * height * 0.6,
                opacity: isRecording && !isPaused ? 1 : 0.3
              }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>
        
        {/* Mini waveform trail */}
        {waveformData.length > 0 && (
          <div 
            className="flex items-center justify-center gap-px overflow-hidden"
            style={{ height: height * 0.3 }}
          >
            {waveformData.slice(-50).map((value, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-muted-foreground/40"
                style={{ height: Math.max(2, value * height * 0.3) }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: bars variant
  return (
    <div 
      className={cn('flex items-end justify-center gap-1', className)}
      style={{ height }}
    >
      {barHeights.map((h, i) => (
        <motion.div
          key={i}
          className={cn(
            'w-2 sm:w-3 rounded-t-sm transition-colors duration-150',
            getLevelColor(audioLevel)
          )}
          animate={{ 
            height: h * height,
            opacity: isRecording && !isPaused ? 1 : 0.3
          }}
          transition={{ 
            duration: 0.05,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
});

export default RecordingVisualizer;
