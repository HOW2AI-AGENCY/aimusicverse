/**
 * Visual waveform preview for section selection
 * Shows selected region with animated markers
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionWaveformPreviewProps {
  duration: number;
  startTime: number;
  endTime: number;
  isValid: boolean;
  className?: string;
}

export function SectionWaveformPreview({
  duration,
  startTime,
  endTime,
  isValid,
  className,
}: SectionWaveformPreviewProps) {
  // Generate pseudo-waveform bars
  const bars = useMemo(() => {
    const barCount = 60;
    return Array.from({ length: barCount }).map((_, i) => {
      // Create varied heights using sine waves and random offset
      const base = 30;
      const variation = Math.sin(i * 0.3) * 20 + Math.cos(i * 0.7) * 15;
      const randomOffset = ((i * 7919) % 100) / 100 * 10; // Deterministic pseudo-random
      return Math.max(10, Math.min(80, base + variation + randomOffset));
    });
  }, []);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const widthPercent = endPercent - startPercent;

  return (
    <div className={cn('relative h-16 rounded-lg bg-muted/30 overflow-hidden', className)}>
      {/* Background waveform */}
      <div className="absolute inset-0 flex items-center justify-around px-1 opacity-30">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-muted-foreground/50"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Selected region */}
      <motion.div
        className={cn(
          'absolute inset-y-0 rounded-md',
          isValid 
            ? 'bg-primary/20 border-x-2 border-primary' 
            : 'bg-destructive/20 border-x-2 border-destructive'
        )}
        animate={{
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Highlighted waveform inside selection */}
        <div className="absolute inset-0 flex items-center justify-around px-0.5 overflow-hidden">
          {bars.slice(
            Math.floor((startPercent / 100) * bars.length),
            Math.ceil((endPercent / 100) * bars.length)
          ).map((height, i) => (
            <motion.div
              key={i}
              className={cn(
                'w-0.5 rounded-full',
                isValid ? 'bg-primary' : 'bg-destructive'
              )}
              style={{ height: `${height}%` }}
              animate={{
                scaleY: [1, 1.1, 1],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Start marker */}
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 w-1 cursor-ew-resize',
          isValid ? 'bg-primary' : 'bg-destructive'
        )}
        animate={{ left: `${startPercent}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={cn(
            'absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2',
            isValid 
              ? 'bg-primary border-primary-foreground' 
              : 'bg-destructive border-destructive-foreground'
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* End marker */}
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 w-1 cursor-ew-resize',
          isValid ? 'bg-primary' : 'bg-destructive'
        )}
        animate={{ left: `${endPercent}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={cn(
            'absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2',
            isValid 
              ? 'bg-primary border-primary-foreground' 
              : 'bg-destructive border-destructive-foreground'
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Time labels */}
      <div className="absolute bottom-1 left-1 text-[10px] font-mono text-muted-foreground bg-background/80 px-1 rounded">
        0:00
      </div>
      <div className="absolute bottom-1 right-1 text-[10px] font-mono text-muted-foreground bg-background/80 px-1 rounded">
        {formatTime(duration)}
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
