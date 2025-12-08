import { useRef, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animation variants
const activeSectionVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.8 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.8,
    transition: { duration: 0.15 }
  }
};

const pillVariants: Variants = {
  initial: { opacity: 0, scale: 0.8, x: -10 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      type: 'spring',
      stiffness: 350,
      damping: 25
    }
  }),
  tap: { scale: 0.92 },
  selected: { 
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

const playheadVariants: Variants = {
  idle: { scale: 1 },
  dragging: { 
    scale: 1.3,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

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
      <AnimatePresence mode="wait">
        {activeSection && (
          <motion.div 
            key={activeSection.label}
            className="flex items-center justify-between px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => navigateSection('prev')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </motion.div>
            
            <motion.div 
              className="text-center"
              variants={activeSectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.span 
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium',
                  'bg-primary/10 text-primary border border-primary/20'
                )}
                layoutId="activeSectionBadge"
              >
                <motion.span 
                  className={cn('w-2.5 h-2.5 rounded-full', SECTION_COLORS[activeSection.type])}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                {activeSection.label}
              </motion.span>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => navigateSection('next')}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              variants={pillVariants}
              initial="initial"
              animate={isSelected ? "selected" : "animate"}
              whileTap="tap"
              custom={idx}
              className={cn(
                'flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium',
                'border-2 min-h-[44px] transition-colors',
                isSelected && 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20',
                isActive && !isSelected && 'border-primary/50 bg-primary/10',
                !isSelected && !isActive && 'border-transparent bg-muted/50 text-muted-foreground',
                isReplaced && 'ring-2 ring-success/50 ring-offset-1 ring-offset-background'
              )}
            >
              <span className="flex items-center gap-1.5">
                <motion.span 
                  className={cn('w-2 h-2 rounded-full', SECTION_COLORS[section.type])}
                  animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                />
                {section.label}
                {isReplaced && (
                  <motion.span 
                    className="text-success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    ✓
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Touch-Optimized Progress Bar */}
      <div 
        ref={containerRef}
        className="relative h-14 touch-none"
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
            const isActive = currentTime >= section.startTime && currentTime <= section.endTime;
            
            return (
              <motion.div
                key={idx}
                className={cn(SECTION_COLORS[section.type], 'absolute h-full')}
                style={{ left: `${left}%`, width: `${width}%` }}
                animate={{ opacity: isActive ? 0.5 : 0.25 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
          
          {/* Progress fill */}
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: isDragging ? 0 : 0.1 }}
          />
        </div>

        {/* Enlarged touch target for playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 -ml-5 flex items-center justify-center"
          style={{ left: `${progress}%` }}
          variants={playheadVariants}
          animate={isDragging ? "dragging" : "idle"}
        >
          <motion.div 
            className={cn(
              'w-6 h-6 bg-primary rounded-full shadow-lg border-[3px] border-background',
              'flex items-center justify-center'
            )}
            animate={isDragging ? { 
              boxShadow: '0 0 0 8px hsl(var(--primary) / 0.2)'
            } : {
              boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)'
            }}
          >
            <div className="w-2 h-2 bg-background rounded-full" />
          </motion.div>
        </motion.div>

        {/* Replaced section indicators */}
        {replacedRanges.map((range, idx) => (
          <motion.div
            key={`replaced-${idx}`}
            className="absolute top-0 h-full pointer-events-none"
            style={{
              left: `${(range.start / duration) * 100}%`,
              width: `${((range.end - range.start) / duration) * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div 
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-lg"
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: ['0 0 0 0 hsl(var(--success) / 0.3)', '0 0 0 4px hsl(var(--success) / 0)', '0 0 0 0 hsl(var(--success) / 0)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[10px] text-success-foreground font-bold">✓</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono px-1">
        <motion.span
          key={Math.floor(currentTime)}
          initial={{ opacity: 0.5, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {formatTime(currentTime)}
        </motion.span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
