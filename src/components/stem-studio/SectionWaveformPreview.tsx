/**
 * Visual waveform preview for section selection
 * Shows selected region with draggable markers for precise selection
 */

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { GripVertical } from 'lucide-react';

interface SectionWaveformPreviewProps {
  duration: number;
  startTime: number;
  endTime: number;
  isValid: boolean;
  className?: string;
  onSelectionChange?: (startTime: number, endTime: number) => void;
  interactive?: boolean;
}

export function SectionWaveformPreview({
  duration,
  startTime,
  endTime,
  isValid,
  className,
  onSelectionChange,
  interactive = false,
}: SectionWaveformPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'region' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialStart, setInitialStart] = useState(startTime);
  const [initialEnd, setInitialEnd] = useState(endTime);

  // Generate pseudo-waveform bars
  const bars = useMemo(() => {
    const barCount = 80;
    return Array.from({ length: barCount }).map((_, i) => {
      const base = 35;
      const variation = Math.sin(i * 0.3) * 25 + Math.cos(i * 0.7) * 15;
      const randomOffset = ((i * 7919) % 100) / 100 * 15;
      return Math.max(15, Math.min(85, base + variation + randomOffset));
    });
  }, []);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const widthPercent = endPercent - startPercent;

  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return percent * duration;
  }, [duration]);

  const handleDragStart = useCallback((type: 'start' | 'end' | 'region', e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive || !onSelectionChange) return;
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setIsDragging(type);
    setDragStartX(clientX);
    setInitialStart(startTime);
    setInitialEnd(endTime);
  }, [interactive, onSelectionChange, startTime, endTime]);

  useEffect(() => {
    if (!isDragging || !onSelectionChange) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - dragStartX;
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaTime = (delta / rect.width) * duration;

      let newStart = initialStart;
      let newEnd = initialEnd;

      if (isDragging === 'start') {
        newStart = Math.max(0, Math.min(initialEnd - 1, initialStart + deltaTime));
      } else if (isDragging === 'end') {
        newEnd = Math.max(initialStart + 1, Math.min(duration, initialEnd + deltaTime));
      } else if (isDragging === 'region') {
        const regionDuration = initialEnd - initialStart;
        newStart = Math.max(0, Math.min(duration - regionDuration, initialStart + deltaTime));
        newEnd = newStart + regionDuration;
      }

      onSelectionChange(newStart, newEnd);
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStartX, initialStart, initialEnd, duration, onSelectionChange]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!interactive || !onSelectionChange || isDragging) return;
    
    const clickTime = getTimeFromPosition(e.clientX);
    const regionDuration = endTime - startTime;
    const halfDuration = regionDuration / 2;
    
    let newStart = clickTime - halfDuration;
    let newEnd = clickTime + halfDuration;
    
    if (newStart < 0) {
      newStart = 0;
      newEnd = regionDuration;
    } else if (newEnd > duration) {
      newEnd = duration;
      newStart = duration - regionDuration;
    }
    
    onSelectionChange(newStart, newEnd);
  }, [interactive, onSelectionChange, isDragging, getTimeFromPosition, startTime, endTime, duration]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative h-20 rounded-lg bg-muted/30 overflow-hidden select-none',
        interactive && 'cursor-pointer',
        isDragging && 'cursor-grabbing',
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Background waveform - high contrast for dark theme */}
      <div className="absolute inset-0 flex items-center justify-around px-1">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-primary/40 dark:bg-primary/60"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Selected region */}
      <motion.div
        className={cn(
          'absolute inset-y-0 rounded-md transition-colors',
          isValid 
            ? 'bg-primary/20 border-x-2 border-primary' 
            : 'bg-destructive/20 border-x-2 border-destructive',
          interactive && isDragging === 'region' && 'bg-primary/30',
          interactive && !isDragging && 'hover:bg-primary/25 cursor-grab'
        )}
        style={{
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        }}
        onMouseDown={(e) => handleDragStart('region', e)}
        onTouchStart={(e) => handleDragStart('region', e)}
      >
        {/* Highlighted waveform inside selection */}
        <div className="absolute inset-0 flex items-center justify-around px-0.5 overflow-hidden pointer-events-none">
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
              animate={isDragging ? {} : {
                scaleY: [1, 1.1, 1],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.03,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </div>

        {/* Drag indicator in center */}
        {interactive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              className={cn(
                'p-1 rounded bg-background/60 backdrop-blur-sm',
                isDragging === 'region' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              animate={{ opacity: isDragging === 'region' ? 1 : 0.5 }}
            >
              <GripVertical className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Start marker */}
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 w-3 -ml-1.5 z-10',
          interactive ? 'cursor-ew-resize' : 'cursor-default'
        )}
        style={{ left: `${startPercent}%` }}
        onMouseDown={(e) => handleDragStart('start', e)}
        onTouchStart={(e) => handleDragStart('start', e)}
      >
        <div className={cn(
          'absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 transition-all',
          isValid ? 'bg-primary' : 'bg-destructive',
          isDragging === 'start' && 'w-1.5 bg-primary shadow-lg shadow-primary/50'
        )} />
        <motion.div
          className={cn(
            'absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-lg',
            isValid 
              ? 'bg-primary border-primary-foreground' 
              : 'bg-destructive border-destructive-foreground',
            isDragging === 'start' && 'scale-125'
          )}
          animate={isDragging !== 'start' ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Time tooltip */}
        {(isDragging === 'start' || isDragging === 'region') && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-mono rounded whitespace-nowrap"
          >
            {formatTime(startTime)}
          </motion.div>
        )}
      </motion.div>

      {/* End marker */}
      <motion.div
        className={cn(
          'absolute top-0 bottom-0 w-3 -ml-1.5 z-10',
          interactive ? 'cursor-ew-resize' : 'cursor-default'
        )}
        style={{ left: `${endPercent}%` }}
        onMouseDown={(e) => handleDragStart('end', e)}
        onTouchStart={(e) => handleDragStart('end', e)}
      >
        <div className={cn(
          'absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 transition-all',
          isValid ? 'bg-primary' : 'bg-destructive',
          isDragging === 'end' && 'w-1.5 bg-primary shadow-lg shadow-primary/50'
        )} />
        <motion.div
          className={cn(
            'absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-lg',
            isValid 
              ? 'bg-primary border-primary-foreground' 
              : 'bg-destructive border-destructive-foreground',
            isDragging === 'end' && 'scale-125'
          )}
          animate={isDragging !== 'end' ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        {/* Time tooltip */}
        {(isDragging === 'end' || isDragging === 'region') && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-mono rounded whitespace-nowrap"
          >
            {formatTime(endTime)}
          </motion.div>
        )}
      </motion.div>

      {/* Time labels */}
      <div className="absolute bottom-1 left-1 text-[10px] font-mono text-muted-foreground bg-background/80 px-1 rounded">
        0:00
      </div>
      <div className="absolute bottom-1 right-1 text-[10px] font-mono text-muted-foreground bg-background/80 px-1 rounded">
        {formatTime(duration)}
      </div>

      {/* Duration indicator */}
      {interactive && (
        <motion.div 
          className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-xs font-mono text-muted-foreground"
          animate={{ opacity: isDragging ? 1 : 0.7 }}
        >
          {formatTime(endTime - startTime)}
        </motion.div>
      )}
    </div>
  );
}

// formatTime imported from @/lib/player-utils
