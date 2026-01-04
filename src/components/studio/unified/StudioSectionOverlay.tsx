/**
 * StudioSectionOverlay
 * Displays detected song sections as colored overlays on the waveform timeline
 * Clickable sections open the section editor
 */

import { memo, useMemo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { DetectedSection } from '@/hooks/useSectionDetection';
import { Check } from 'lucide-react';

interface ReplacedRange {
  start: number;
  end: number;
}

interface StudioSectionOverlayProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges: ReplacedRange[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  className?: string;
}

// Section type colors - using semantic tokens where possible
const SECTION_COLORS: Record<DetectedSection['type'], { bg: string; border: string; text: string }> = {
  'verse': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  'chorus': { bg: 'bg-purple-500/25', border: 'border-purple-500/60', text: 'text-purple-400' },
  'bridge': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  'intro': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  'outro': { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
  'pre-chorus': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  'hook': { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  'unknown': { bg: 'bg-muted/30', border: 'border-border', text: 'text-muted-foreground' },
};

export const StudioSectionOverlay = memo(function StudioSectionOverlay({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges,
  onSectionClick,
  className,
}: StudioSectionOverlayProps) {
  
  // Check if a section overlaps with replaced ranges
  const isSectionReplaced = useCallback((section: DetectedSection): boolean => {
    return replacedRanges.some(range => {
      const overlap = Math.max(0, Math.min(section.endTime, range.end) - Math.max(section.startTime, range.start));
      const sectionDuration = section.endTime - section.startTime;
      return overlap > sectionDuration * 0.5; // >50% overlap counts as replaced
    });
  }, [replacedRanges]);

  // Find active section based on current time
  const activeIndex = useMemo(() => {
    return sections.findIndex(s => currentTime >= s.startTime && currentTime < s.endTime);
  }, [sections, currentTime]);

  if (!sections.length || duration <= 0) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {sections.map((section, index) => {
        const left = (section.startTime / duration) * 100;
        const width = ((section.endTime - section.startTime) / duration) * 100;
        const colors = SECTION_COLORS[section.type];
        const isSelected = selectedIndex === index;
        const isActive = activeIndex === index;
        const isReplaced = isSectionReplaced(section);

        return (
          <motion.button
            key={`${section.type}-${section.startTime}-${index}`}
            className={cn(
              "absolute top-5 bottom-0 flex flex-col items-start justify-start p-1",
              "border-l-2 border-r transition-all duration-200 cursor-pointer pointer-events-auto",
              "hover:brightness-110",
              colors.bg,
              colors.border,
              isSelected && "ring-2 ring-primary ring-inset brightness-125",
              isActive && !isSelected && "brightness-110"
            )}
            style={{ 
              left: `${left}%`, 
              width: `${width}%`,
              minWidth: '2rem',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSectionClick(section, index);
            }}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0.85,
            }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.995 }}
          >
            {/* Section label */}
            <div className={cn(
              "flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium truncate max-w-full",
              "bg-background/60 backdrop-blur-sm",
              colors.text
            )}>
              <span className="truncate">{section.label}</span>
              {isReplaced && (
                <Check className="w-3 h-3 text-green-500 shrink-0" />
              )}
            </div>

            {/* Active pulse indicator */}
            {isActive && (
              <motion.div
                className="absolute left-0 top-5 bottom-0 w-0.5 bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
});
