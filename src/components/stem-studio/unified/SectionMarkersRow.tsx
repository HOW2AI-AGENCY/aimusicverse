/**
 * SectionMarkersRow
 * 
 * Horizontal row of clickable section markers for the unified timeline.
 * Click = seek to section start + select
 * Shows "ЗАМЕНИТЬ" button on selected section
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Scissors, Wand2 } from 'lucide-react';

interface SectionMarkersRowProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onReplaceClick?: (section: DetectedSection, index: number) => void;
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

export const SectionMarkersRow = memo(({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges = [],
  onSectionClick,
  onReplaceClick,
}: SectionMarkersRowProps) => {
  // Calculate section positions
  const sectionPositions = useMemo(() => {
    return sections.map((section) => ({
      left: (section.startTime / duration) * 100,
      width: ((section.endTime - section.startTime) / duration) * 100,
    }));
  }, [sections, duration]);

  if (sections.length === 0) return null;

  return (
    <div className="relative h-10 rounded-md overflow-visible bg-muted/20">
      <TooltipProvider delayDuration={100}>
        {sections.map((section, idx) => {
          const pos = sectionPositions[idx];
          const colors = SECTION_COLORS[section.type];
          const isSelected = selectedIndex === idx;
          const isActive = currentTime >= section.startTime && currentTime <= section.endTime;
          const isReplaced = replacedRanges.some(
            r => Math.abs(r.start - section.startTime) < 0.5 && Math.abs(r.end - section.endTime) < 0.5
          );

          return (
            <div key={idx} className="contents">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={cn(
                      'absolute top-0 h-full border-x transition-all',
                      colors.bg,
                      colors.border,
                      isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background z-10 brightness-125',
                      isActive && !isSelected && 'brightness-110',
                      isReplaced && 'ring-1 ring-success/50',
                      'cursor-pointer',
                      'hover:brightness-125 hover:z-[5]'
                    )}
                    style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                    onClick={() => onSectionClick(section, idx)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Replaced indicator */}
                    {isReplaced && (
                      <motion.div
                        className="absolute -top-0.5 right-0.5 w-2 h-2 bg-success rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                    
                    <div className={cn(
                      'absolute inset-0 flex items-center justify-center gap-0.5 text-[9px] font-medium truncate px-0.5',
                      colors.text
                    )}>
                      {pos.width > 6 && <Scissors className="w-2.5 h-2.5 opacity-50" />}
                      {pos.width > 10 && <span className="truncate">{section.label}</span>}
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-muted-foreground">
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </div>
                  <div className="text-primary text-[10px] mt-0.5">
                    Клик для перехода
                  </div>
                </TooltipContent>
              </Tooltip>
              
              {/* Replace button on selected section */}
              <AnimatePresence>
                {isSelected && onReplaceClick && (
                  <motion.div
                    className="absolute z-20"
                    style={{ 
                      left: `${pos.left + pos.width / 2}%`,
                      top: '-2px',
                      transform: 'translate(-50%, -100%)',
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                  >
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplaceClick(section, idx);
                      }}
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      ЗАМЕНИТЬ
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
});

SectionMarkersRow.displayName = 'SectionMarkersRow';
