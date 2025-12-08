import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionSelectorProps {
  duration: number;
  currentTime: number;
  onSelectionChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
  initialStart?: number;
  initialEnd?: number;
  maxSectionPercent?: number;
}

export function SectionSelector({
  duration,
  currentTime,
  onSelectionChange,
  onSeek,
  initialStart,
  initialEnd,
  maxSectionPercent = 50,
}: SectionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState(initialStart ?? duration * 0.2);
  const [endTime, setEndTime] = useState(initialEnd ?? duration * 0.4);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const maxDuration = (duration * maxSectionPercent) / 100;
  const sectionDuration = endTime - startTime;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(startTime, endTime);
  }, [startTime, endTime, onSelectionChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return 0;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position)) * duration;
  }, [duration]);

  const handleDragStart = (handle: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const newTime = getPositionFromEvent(e);
      
      if (isDragging === 'start') {
        const newStart = Math.min(newTime, endTime - 1);
        setStartTime(Math.max(0, newStart));
      } else {
        const newEnd = Math.max(newTime, startTime + 1);
        setEndTime(Math.min(duration, newEnd));
      }
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, endTime, startTime, duration, getPositionFromEvent]);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const currentPercent = (currentTime / duration) * 100;

  return (
    <div className="space-y-3">
      {/* Selection Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Секция:</span>
          <span className="font-mono font-medium">
            {formatTime(startTime)} — {formatTime(endTime)}
          </span>
          <span className="text-muted-foreground">
            ({formatTime(sectionDuration)})
          </span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 text-xs",
          isValid ? "text-green-500" : "text-destructive"
        )}>
          {isValid ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Можно заменить</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Макс. {maxSectionPercent}% ({formatTime(maxDuration)})</span>
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={containerRef}
        className="relative h-16 bg-muted/50 rounded-lg overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (isDragging) return;
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const time = ((e.clientX - rect.left) / rect.width) * duration;
          onSeek(time);
        }}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 border-r border-border/30 last:border-r-0"
            />
          ))}
        </div>

        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 py-0.5 text-[10px] text-muted-foreground font-mono">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Selected Region */}
        <motion.div
          className={cn(
            "absolute top-0 bottom-6 rounded",
            isValid 
              ? "bg-primary/30 border-y-2 border-primary" 
              : "bg-destructive/30 border-y-2 border-destructive"
          )}
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Start Handle */}
        <motion.div
          className={cn(
            "absolute top-0 bottom-6 w-3 cursor-ew-resize flex items-center justify-center z-10",
            "bg-primary rounded-l border-2 border-primary-foreground shadow-lg",
            isDragging === 'start' && "ring-2 ring-primary ring-offset-2"
          )}
          style={{ left: `calc(${startPercent}% - 6px)` }}
          onMouseDown={handleDragStart('start')}
          onTouchStart={handleDragStart('start')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical className="w-2.5 h-2.5 text-primary-foreground" />
        </motion.div>

        {/* End Handle */}
        <motion.div
          className={cn(
            "absolute top-0 bottom-6 w-3 cursor-ew-resize flex items-center justify-center z-10",
            "bg-primary rounded-r border-2 border-primary-foreground shadow-lg",
            isDragging === 'end' && "ring-2 ring-primary ring-offset-2"
          )}
          style={{ left: `calc(${endPercent}% - 6px)` }}
          onMouseDown={handleDragStart('end')}
          onTouchStart={handleDragStart('end')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical className="w-2.5 h-2.5 text-primary-foreground" />
        </motion.div>

        {/* Current Time Indicator */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20"
          style={{ left: `${currentPercent}%` }}
          initial={false}
          animate={{ left: `${currentPercent}%` }}
        />
      </div>
    </div>
  );
}
