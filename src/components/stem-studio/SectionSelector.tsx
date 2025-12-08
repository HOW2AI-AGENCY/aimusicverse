import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetectedSection } from '@/hooks/useSectionDetection';

interface SectionSelectorProps {
  duration: number;
  currentTime: number;
  onSelectionChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
  initialStart?: number;
  initialEnd?: number;
  maxSectionPercent?: number;
  detectedSections?: DetectedSection[];
  onSectionClick?: (section: DetectedSection, index: number) => void;
}

// Section type colors for visualization
const SECTION_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  'verse': { bg: 'bg-blue-500/40', border: 'border-blue-500', label: 'К' },
  'chorus': { bg: 'bg-purple-500/40', border: 'border-purple-500', label: 'П' },
  'bridge': { bg: 'bg-amber-500/40', border: 'border-amber-500', label: 'Б' },
  'intro': { bg: 'bg-green-500/40', border: 'border-green-500', label: 'И' },
  'outro': { bg: 'bg-rose-500/40', border: 'border-rose-500', label: 'А' },
  'pre-chorus': { bg: 'bg-cyan-500/40', border: 'border-cyan-500', label: 'ПП' },
  'hook': { bg: 'bg-orange-500/40', border: 'border-orange-500', label: 'Х' },
  'unknown': { bg: 'bg-muted/60', border: 'border-muted-foreground', label: '?' },
};

export function SectionSelector({
  duration,
  currentTime,
  onSelectionChange,
  onSeek,
  initialStart,
  initialEnd,
  maxSectionPercent = 50,
  detectedSections = [],
  onSectionClick,
}: SectionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState(initialStart ?? duration * 0.2);
  const [endTime, setEndTime] = useState(initialEnd ?? duration * 0.4);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  const maxDuration = (duration * maxSectionPercent) / 100;
  const sectionDuration = endTime - startTime;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  // Sync with external initialStart/initialEnd changes
  useEffect(() => {
    if (initialStart !== undefined) setStartTime(initialStart);
    if (initialEnd !== undefined) setEndTime(initialEnd);
  }, [initialStart, initialEnd]);

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
      <motion.div 
        className="flex items-center justify-between text-sm"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              "px-2.5 py-1 rounded-md font-mono text-sm",
              isValid 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}
            animate={{ scale: isDragging ? 1.02 : 1 }}
          >
            {formatTime(startTime)} — {formatTime(endTime)}
          </motion.div>
          <span className="text-muted-foreground text-xs">
            ({formatTime(sectionDuration)})
          </span>
        </div>
        
        <motion.div 
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
            isValid 
              ? "bg-green-500/10 text-green-600 dark:text-green-400" 
              : "bg-destructive/10 text-destructive"
          )}
          animate={{ 
            scale: isValid ? [1, 1.02, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {isValid ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Check className="w-3.5 h-3.5" />
              </motion.div>
              <span>Можно заменить</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              <span>Макс. {maxSectionPercent}% ({formatTime(maxDuration)})</span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Timeline */}
      <div 
        ref={containerRef}
        className="relative h-20 bg-muted/50 rounded-lg overflow-hidden cursor-pointer"
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

        {/* Detected Sections Visualization */}
        {detectedSections.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-6">
            {detectedSections.map((section, idx) => {
              const leftPercent = (section.startTime / duration) * 100;
              const widthPercent = ((section.endTime - section.startTime) / duration) * 100;
              const colors = SECTION_COLORS[section.type] || SECTION_COLORS.unknown;
              const isHovered = hoveredSection === idx;

              return (
                <motion.div
                  key={idx}
                  className={cn(
                    "absolute top-0 h-full border-b-2 cursor-pointer transition-all",
                    colors.bg,
                    colors.border,
                    isHovered && "brightness-125 z-10"
                  )}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick?.(section, idx);
                  }}
                  onMouseEnter={() => setHoveredSection(idx)}
                  onMouseLeave={() => setHoveredSection(null)}
                  whileHover={{ y: -1 }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground/80 truncate px-1">
                    {section.label}
                  </span>
                  
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border rounded shadow-lg text-xs whitespace-nowrap z-50"
                    >
                      {section.label} ({formatTime(section.startTime)} - {formatTime(section.endTime)})
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 py-0.5 text-[10px] text-muted-foreground font-mono">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Selected Region */}
        <motion.div
          className={cn(
            "absolute rounded",
            detectedSections.length > 0 ? "top-6 bottom-6" : "top-0 bottom-6",
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
            "absolute w-3 cursor-ew-resize flex items-center justify-center z-10",
            "bg-primary rounded-l border-2 border-primary-foreground shadow-lg",
            isDragging === 'start' && "ring-2 ring-primary ring-offset-2",
            detectedSections.length > 0 ? "top-6 bottom-6" : "top-0 bottom-6"
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
            "absolute w-3 cursor-ew-resize flex items-center justify-center z-10",
            "bg-primary rounded-r border-2 border-primary-foreground shadow-lg",
            isDragging === 'end' && "ring-2 ring-primary ring-offset-2",
            detectedSections.length > 0 ? "top-6 bottom-6" : "top-0 bottom-6"
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

      {/* Section Legend */}
      {detectedSections.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[10px]">
          {Object.entries(SECTION_COLORS).slice(0, -1).map(([type, colors]) => {
            const hasType = detectedSections.some(s => s.type === type);
            if (!hasType) return null;
            
            return (
              <div key={type} className="flex items-center gap-1">
                <div className={cn("w-3 h-3 rounded", colors.bg, "border", colors.border)} />
                <span className="text-muted-foreground capitalize">
                  {type === 'verse' && 'Куплет'}
                  {type === 'chorus' && 'Припев'}
                  {type === 'bridge' && 'Бридж'}
                  {type === 'intro' && 'Интро'}
                  {type === 'outro' && 'Аутро'}
                  {type === 'pre-chorus' && 'Пре-припев'}
                  {type === 'hook' && 'Хук'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
