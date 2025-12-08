import { useRef, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileSectionTimelineProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
}

const SECTION_COLORS: Record<DetectedSection['type'], string> = {
  verse: 'bg-blue-500',
  chorus: 'bg-purple-500',
  bridge: 'bg-amber-500',
  intro: 'bg-green-500',
  outro: 'bg-rose-500',
  'pre-chorus': 'bg-cyan-500',
  hook: 'bg-orange-500',
  unknown: 'bg-muted-foreground',
};

export function MobileSectionTimeline({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges = [],
  onSectionClick,
  onSeek,
}: MobileSectionTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle touch/drag seek
  const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent, info?: PanInfo) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;
    onSeek(time);
  }, [duration, onSeek]);

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  // Navigate to prev/next section
  const navigateSection = (direction: 'prev' | 'next') => {
    if (sections.length === 0) return;
    
    const currentIdx = sections.findIndex(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    );
    
    let newIdx: number;
    if (direction === 'prev') {
      newIdx = currentIdx <= 0 ? sections.length - 1 : currentIdx - 1;
    } else {
      newIdx = currentIdx >= sections.length - 1 ? 0 : currentIdx + 1;
    }
    
    onSeek(sections[newIdx].startTime);
  };

  // Find active section
  const activeSection = sections.find(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="space-y-3">
      {/* Active Section Display */}
      {activeSection && (
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => navigateSection('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <motion.div 
            className="text-center"
            key={activeSection.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
              'bg-primary/10 text-primary'
            )}>
              <span className={cn('w-2 h-2 rounded-full', SECTION_COLORS[activeSection.type])} />
              {activeSection.label}
            </span>
          </motion.div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => navigateSection('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Compact Section Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
        {sections.map((section, idx) => {
          const isSelected = selectedIndex === idx;
          const isActive = currentTime >= section.startTime && currentTime <= section.endTime;
          const isReplaced = replacedRanges.some(
            r => Math.abs(r.start - section.startTime) < 1 && Math.abs(r.end - section.endTime) < 1
          );

          return (
            <motion.button
              key={idx}
              onClick={() => onSectionClick(section, idx)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                'border-2 min-h-[36px] active:scale-95',
                isSelected && 'border-primary bg-primary/20 text-primary',
                isActive && !isSelected && 'border-primary/50 bg-primary/10',
                !isSelected && !isActive && 'border-transparent bg-muted/50 text-muted-foreground',
                isReplaced && 'ring-2 ring-success/50'
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', SECTION_COLORS[section.type])} />
                {section.label}
                {isReplaced && <span className="text-success">✓</span>}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Touch-Optimized Progress Bar */}
      <div 
        ref={containerRef}
        className="relative h-12 touch-none"
        onTouchStart={handleDragStart}
        onTouchMove={handleDrag}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => { handleDragStart(); handleDrag(e); }}
        onMouseMove={(e) => isDragging && handleDrag(e)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Background with section colors */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-muted/30 rounded-full overflow-hidden">
          {sections.map((section, idx) => {
            const left = (section.startTime / duration) * 100;
            const width = ((section.endTime - section.startTime) / duration) * 100;
            
            return (
              <div
                key={idx}
                className={cn(SECTION_COLORS[section.type], 'absolute h-full opacity-30')}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            );
          })}
          
          {/* Progress fill */}
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            layout
          />
        </div>

        {/* Enlarged touch target for playhead */}
        <motion.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-8 h-8 -ml-4',
            'flex items-center justify-center',
            isDragging && 'scale-125'
          )}
          style={{ left: `${progress}%` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
        >
          <div className={cn(
            'w-5 h-5 bg-primary rounded-full shadow-lg border-3 border-background',
            'flex items-center justify-center',
            isDragging && 'ring-4 ring-primary/30'
          )}>
            <div className="w-2 h-2 bg-background rounded-full" />
          </div>
        </motion.div>

        {/* Replaced section indicators */}
        {replacedRanges.map((range, idx) => (
          <div
            key={`replaced-${idx}`}
            className="absolute top-0 h-full pointer-events-none"
            style={{
              left: `${(range.start / duration) * 100}%`,
              width: `${((range.end - range.start) / duration) * 100}%`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-success rounded-full flex items-center justify-center">
              <span className="text-[8px] text-success-foreground font-bold">✓</span>
            </div>
          </div>
        ))}
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
