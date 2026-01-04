/**
 * StudioSectionOverlay
 * Displays detected song sections as colored overlays on the waveform timeline
 * Clickable sections open the section editor
 */

import { memo, useMemo, useCallback } from 'react';
import type { AlignedWord } from '@/hooks/useTimestampedLyrics';
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
  'unknown': { bg: 'bg-slate-500/25', border: 'border-slate-500/50', text: 'text-slate-300' },
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

  // Fill gaps between sections to ensure full timeline coverage - NO GAPS ALLOWED
  const normalizedSections = useMemo(() => {
    if (duration <= 0) return [];
    
    // If no sections, create one section covering the whole track
    if (!sections.length) {
      return [{
        type: 'unknown' as const,
        label: 'Трек',
        startTime: 0,
        endTime: duration,
        lyrics: '',
        words: [],
      }];
    }
    
    const result: DetectedSection[] = [];
    let currentEnd = 0;
    
    // Ensure first section starts from 0
    if (sections[0].startTime > 0) {
      result.push({
        type: 'intro' as const,
        label: 'Интро',
        startTime: 0,
        endTime: sections[0].startTime,
        lyrics: '',
        words: [],
      });
      currentEnd = sections[0].startTime;
    }
    
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i];
      
      // Fill ANY gap before current section - no threshold, fill all gaps
      if (current.startTime > currentEnd) {
        result.push({
          type: 'unknown' as const,
          label: 'Переход',
          startTime: currentEnd,
          endTime: current.startTime,
          lyrics: '',
          words: [],
        });
        currentEnd = current.startTime;
      }
      
      // Add current section, ensuring it starts where previous ended
      const adjustedSection = {
        ...current,
        startTime: Math.max(current.startTime, currentEnd),
      };
      result.push(adjustedSection);
      currentEnd = adjustedSection.endTime;
    }
    
    // ALWAYS extend last section to full duration - no gap at the end
    if (result.length > 0 && currentEnd < duration) {
      result[result.length - 1] = {
        ...result[result.length - 1],
        endTime: duration,
      };
    }
    
    return result;
  }, [sections, duration]);

  if (!normalizedSections.length || duration <= 0) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {normalizedSections.map((section, index) => {
        const left = (section.startTime / duration) * 100;
        const width = ((section.endTime - section.startTime) / duration) * 100;
        const colors = SECTION_COLORS[section.type];
        // Map back to original index for selection
        const originalIndex = sections.findIndex(s => 
          s.startTime === section.startTime && s.type === section.type
        );
        const isSelected = selectedIndex === originalIndex && originalIndex !== -1;
        const isActive = currentTime >= section.startTime && currentTime < section.endTime;
        const isReplaced = isSectionReplaced(section);

        return (
          <motion.button
            key={`${section.type}-${section.startTime}-${index}`}
            className={cn(
              "absolute top-0 bottom-0 flex flex-col items-start justify-start pt-1 px-0.5",
              "border-l border-r-0 transition-all duration-200 cursor-pointer pointer-events-auto",
              "hover:brightness-110",
              colors.bg,
              "border-white/20",
              isSelected && "ring-2 ring-primary ring-inset brightness-125",
              isActive && !isSelected && "brightness-110"
            )}
            style={{ 
              left: `${left}%`, 
              width: `${width}%`,
              minWidth: '1rem',
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Only trigger for original sections, not gap fillers
              if (originalIndex !== -1) {
                onSectionClick(section, originalIndex);
              }
            }}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0.75,
            }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.995 }}
          >
            {/* Section label */}
            <div className={cn(
              "flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium truncate max-w-full",
              "bg-background/70 backdrop-blur-sm",
              colors.text
            )}>
              <span className="truncate">{section.label}</span>
              {isReplaced && (
                <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
              )}
            </div>

            {/* Active pulse indicator */}
            {isActive && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
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
