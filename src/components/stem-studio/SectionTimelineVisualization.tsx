import { useMemo } from 'react';
import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Animation variants
const sectionVariants: Variants = {
  initial: { opacity: 0, scaleY: 0 },
  animate: (i: number) => ({
    opacity: 1,
    scaleY: 1,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }),
  selected: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

const playheadVariants: Variants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  }
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: { duration: 1.5, repeat: Infinity }
  }
};

interface SectionTimelineVisualizationProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  customRange: { start: number; end: number } | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
}

const SECTION_COLORS: Record<DetectedSection['type'], { bg: string; border: string; text: string }> = {
  verse: { bg: 'bg-blue-500/30', border: 'border-blue-500/50', text: 'text-blue-400' },
  chorus: { bg: 'bg-purple-500/30', border: 'border-purple-500/50', text: 'text-purple-400' },
  bridge: { bg: 'bg-amber-500/30', border: 'border-amber-500/50', text: 'text-amber-400' },
  intro: { bg: 'bg-green-500/30', border: 'border-green-500/50', text: 'text-green-400' },
  outro: { bg: 'bg-rose-500/30', border: 'border-rose-500/50', text: 'text-rose-400' },
  'pre-chorus': { bg: 'bg-cyan-500/30', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  hook: { bg: 'bg-orange-500/30', border: 'border-orange-500/50', text: 'text-orange-400' },
  unknown: { bg: 'bg-muted/50', border: 'border-muted', text: 'text-muted-foreground' },
};

export function SectionTimelineVisualization({
  sections,
  duration,
  currentTime,
  selectedIndex,
  customRange,
  replacedRanges = [],
  onSectionClick,
  onSeek,
}: SectionTimelineVisualizationProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // formatTime imported from @/lib/player-utils

  // Calculate section positions
  const sectionPositions = useMemo(() => {
    return sections.map((section) => ({
      left: (section.startTime / duration) * 100,
      width: ((section.endTime - section.startTime) / duration) * 100,
    }));
  }, [sections, duration]);

  return (
    <div className="relative w-full">
      {/* Section visualization row */}
      <div className="relative h-8 mb-2 rounded-md overflow-hidden bg-muted/30">
        <TooltipProvider delayDuration={100}>
          {sections.map((section, idx) => {
            const pos = sectionPositions[idx];
            const colors = SECTION_COLORS[section.type];
            const isSelected = selectedIndex === idx;
            const isActive = currentTime >= section.startTime && currentTime <= section.endTime;

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <motion.button
                    variants={sectionVariants}
                    initial="initial"
                    animate={isSelected ? "selected" : "animate"}
                    custom={idx}
                    className={cn(
                      'absolute top-0 h-full border-x transition-all',
                      colors.bg,
                      colors.border,
                      isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background z-10 brightness-125',
                      isActive && !isSelected && 'brightness-110',
                      'cursor-pointer origin-bottom',
                      'hover:brightness-125 hover:z-[5]',
                      'active:scale-[0.98]'
                    )}
                    style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                    onClick={() => onSectionClick(section, idx)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active pulse indicator */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-white/20"
                        variants={pulseVariants}
                        animate="animate"
                      />
                    )}
                    
                    {/* Selected glow */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-primary/20"
                        animate={{ 
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    
                    <span className={cn(
                      'absolute inset-0 flex items-center justify-center text-[10px] font-medium truncate px-1',
                      colors.text,
                      isSelected && 'font-semibold'
                    )}>
                      {pos.width > 8 ? section.label : ''}
                    </span>
                    
                    {/* Click hint on hover */}
                    {!isSelected && pos.width > 15 && (
                      <motion.div
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-foreground/60 opacity-0 group-hover:opacity-100"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        Нажмите
                      </motion.div>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-muted-foreground">
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </div>
                  <div className="text-primary text-[10px] mt-0.5">
                    Нажмите для замены
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Replaced sections markers */}
        <AnimatePresence>
          {replacedRanges.map((range, idx) => (
            <motion.div
              key={`replaced-${idx}`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute top-0 h-full bg-success/20 border-x border-success/50 pointer-events-none origin-bottom"
              style={{
                left: `${(range.start / duration) * 100}%`,
                width: `${((range.end - range.start) / duration) * 100}%`,
              }}
            >
              <motion.div 
                className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-success text-success-foreground text-[8px] font-bold rounded"
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                ✓
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Custom selection overlay */}
        <AnimatePresence>
          {customRange && selectedIndex === null && (
            <motion.div
              className="absolute top-0 h-full bg-primary/30 border-x-2 border-primary pointer-events-none z-20"
              style={{
                left: `${(customRange.start / duration) * 100}%`,
                width: `${((customRange.end - customRange.start) / duration) * 100}%`,
              }}
              initial={{ opacity: 0, scaleY: 0.5 }}
              animate={{ 
                opacity: 1, 
                scaleY: 1,
                boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.3)', '0 0 0 4px hsl(var(--primary) / 0)', '0 0 0 0 hsl(var(--primary) / 0)']
              }}
              exit={{ opacity: 0, scaleY: 0.5 }}
              transition={{ 
                opacity: { duration: 0.2 },
                scaleY: { type: 'spring', stiffness: 300, damping: 20 },
                boxShadow: { duration: 1.5, repeat: Infinity }
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div 
        className="relative h-3 bg-primary/15 rounded-full cursor-pointer group border border-primary/30"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const time = (x / rect.width) * duration;
          onSeek(time);
        }}
      >
        {/* Progress fill */}
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
        
        {/* Playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/40 border-2 border-background z-30"
          style={{ left: `${progress}%`, marginLeft: '-8px' }}
          variants={playheadVariants}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.4 }}
        />
        
        {/* Hover effect */}
        <div className="absolute inset-0 rounded-full group-hover:bg-primary/10 transition-colors" />
      </div>

      {/* Time markers */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
        <motion.span
          key={Math.floor(currentTime)}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {formatTime(currentTime)}
        </motion.span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
