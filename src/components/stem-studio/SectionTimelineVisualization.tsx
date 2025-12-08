import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                    className={cn(
                      'absolute top-0 h-full border-x transition-all',
                      colors.bg,
                      colors.border,
                      isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background z-10',
                      isActive && 'brightness-125',
                      'hover:brightness-110 cursor-pointer'
                    )}
                    style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                    onClick={() => onSectionClick(section, idx)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={cn(
                      'absolute inset-0 flex items-center justify-center text-[10px] font-medium truncate px-1',
                      colors.text
                    )}>
                      {pos.width > 8 ? section.label : ''}
                    </span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-muted-foreground">
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Replaced sections markers */}
        {replacedRanges.map((range, idx) => (
          <div
            key={`replaced-${idx}`}
            className="absolute top-0 h-full bg-success/20 border-x border-success/50 pointer-events-none"
            style={{
              left: `${(range.start / duration) * 100}%`,
              width: `${((range.end - range.start) / duration) * 100}%`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-success text-success-foreground text-[8px] font-bold rounded">
              ✓
            </div>
          </div>
        ))}

        {/* Custom selection overlay */}
        {customRange && selectedIndex === null && (
          <motion.div
            className="absolute top-0 h-full bg-primary/30 border-x-2 border-primary pointer-events-none z-20"
            style={{
              left: `${(customRange.start / duration) * 100}%`,
              width: `${((customRange.end - customRange.start) / duration) * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* Progress bar */}
      <div 
        className="relative h-2 bg-muted/50 rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const time = (x / rect.width) * duration;
          onSeek(time);
        }}
      >
        {/* Progress fill */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary/50 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        
        {/* Playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg border-2 border-background z-30"
          style={{ left: `${progress}%`, marginLeft: '-6px' }}
          whileHover={{ scale: 1.3 }}
        />
        
        {/* Hover effect */}
        <div className="absolute inset-0 rounded-full group-hover:bg-foreground/5 transition-colors" />
      </div>

      {/* Time markers */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
