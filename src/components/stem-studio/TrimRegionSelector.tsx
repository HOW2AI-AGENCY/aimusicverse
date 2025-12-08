import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrimRegionSelectorProps {
  duration: number;
  currentTime: number;
  onRegionChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
  className?: string;
}

export const TrimRegionSelector = ({
  duration,
  currentTime,
  onRegionChange,
  onSeek,
  className,
}: TrimRegionSelectorProps) => {
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'region' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRegion, setDragStartRegion] = useState<{ start: number; end: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current || !duration) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  }, [duration]);

  const getPositionFromTime = useCallback((time: number) => {
    if (!duration) return 0;
    return (time / duration) * 100;
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'start' | 'end' | 'region' | 'track') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'track') {
      const time = getTimeFromPosition(e.clientX);
      if (region) {
        // Click outside region - deselect
        if (time < region.start || time > region.end) {
          setRegion(null);
          onRegionChange(0, 0);
        } else {
          onSeek(time);
        }
      } else {
        // Start new selection
        setRegion({ start: time, end: time });
        setIsDragging('end');
        setDragStartX(e.clientX);
      }
    } else {
      setIsDragging(type);
      setDragStartX(e.clientX);
      setDragStartRegion(region ? { ...region } : null);
    }
  }, [getTimeFromPosition, region, onRegionChange, onSeek]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const time = getTimeFromPosition(e.clientX);
    
    if (isDragging === 'start' && region) {
      const newStart = Math.min(time, region.end - 1);
      setRegion({ ...region, start: Math.max(0, newStart) });
    } else if (isDragging === 'end' && region) {
      const newEnd = Math.max(time, region.start + 1);
      setRegion({ ...region, end: Math.min(duration, newEnd) });
    } else if (isDragging === 'region' && dragStartRegion) {
      const deltaX = e.clientX - dragStartX;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaTime = (deltaX / rect.width) * duration;
      
      let newStart = dragStartRegion.start + deltaTime;
      let newEnd = dragStartRegion.end + deltaTime;
      
      // Keep within bounds
      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd > duration) {
        newStart -= (newEnd - duration);
        newEnd = duration;
      }
      
      setRegion({ start: Math.max(0, newStart), end: Math.min(duration, newEnd) });
    }
  }, [isDragging, region, duration, getTimeFromPosition, dragStartX, dragStartRegion]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && region && region.end > region.start) {
      onRegionChange(region.start, region.end);
    }
    setIsDragging(null);
    setDragStartRegion(null);
  }, [isDragging, region, onRegionChange]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-16 bg-muted/30 rounded-lg overflow-hidden cursor-crosshair select-none",
        className
      )}
      onMouseDown={(e) => handleMouseDown(e, 'track')}
    >
      {/* Waveform background placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-end gap-0.5 h-10">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-muted-foreground/20 rounded-full"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>

      {/* Selected region */}
      {region && region.end > region.start && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 bottom-0 bg-primary/30 border-x-2 border-primary cursor-move"
          style={{
            left: `${getPositionFromTime(region.start)}%`,
            width: `${getPositionFromTime(region.end) - getPositionFromTime(region.start)}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'region')}
        >
          {/* Start handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize hover:bg-primary/50 flex items-center justify-center"
            onMouseDown={(e) => handleMouseDown(e, 'start')}
          >
            <div className="w-0.5 h-8 bg-primary rounded-full" />
          </div>
          
          {/* End handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-ew-resize hover:bg-primary/50 flex items-center justify-center"
            onMouseDown={(e) => handleMouseDown(e, 'end')}
          >
            <div className="w-0.5 h-8 bg-primary rounded-full" />
          </div>

          {/* Duration label */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
            {formatTime(region.end - region.start)}
          </div>
        </motion.div>
      )}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10 pointer-events-none"
        style={{ left: `${getPositionFromTime(currentTime)}%` }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rounded-full" />
      </div>

      {/* Time markers */}
      <div className="absolute bottom-1 left-2 text-[10px] text-muted-foreground font-mono">
        {formatTime(region?.start || 0)}
      </div>
      <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground font-mono">
        {formatTime(region?.end || duration)}
      </div>
    </div>
  );
};
