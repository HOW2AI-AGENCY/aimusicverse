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

// Gap merge threshold - used only for merging adjacent same-type sections
// We DO NOT create "Переход" blocks from gaps; gaps are absorbed by neighboring sections.
const GAP_MERGE_THRESHOLD_S = 3.0;

// Section type colors - improved contrast for dark theme
const SECTION_COLORS: Record<DetectedSection['type'], { bg: string; border: string; text: string }> = {
  'verse': { bg: 'bg-blue-500/25', border: 'border-blue-500/60', text: 'text-blue-400' },
  'chorus': { bg: 'bg-purple-500/30', border: 'border-purple-500/70', text: 'text-purple-300' },
  'bridge': { bg: 'bg-amber-500/25', border: 'border-amber-500/60', text: 'text-amber-400' },
  'intro': { bg: 'bg-green-500/25', border: 'border-green-500/60', text: 'text-green-400' },
  'outro': { bg: 'bg-rose-500/25', border: 'border-rose-500/60', text: 'text-rose-400' },
  'pre-chorus': { bg: 'bg-cyan-500/25', border: 'border-cyan-500/60', text: 'text-cyan-400' },
  'hook': { bg: 'bg-pink-500/25', border: 'border-pink-500/60', text: 'text-pink-400' },
  // Unknown/transition - improved contrast for dark theme
  'unknown': { bg: 'bg-neutral-400/35', border: 'border-neutral-400/60', text: 'text-neutral-200' },
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

  /**
   * Normalize and merge sections to prevent fragmentation
   * 
   * Strategy:
   * 1. Small gaps (< GAP_MERGE_THRESHOLD_S) - extend previous section
   * 2. Merge adjacent sections of the same type
   * 3. Only create "Переход" for significant gaps
   */
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
    
    // Always start from 0 (avoid creating artificial "Переход"/intro-only fillers here)
    currentEnd = 0;
    
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i];
      const gapSize = current.startTime - currentEnd;
      
      // Absorb any gap by extending the previous section (no standalone transition blocks)
      if (gapSize > 0 && result.length > 0) {
        result[result.length - 1] = {
          ...result[result.length - 1],
          endTime: current.startTime,
        };
        currentEnd = current.startTime;
      }
      
      // Check if we can merge with previous section of same type
      const lastSection = result[result.length - 1];
      if (
        lastSection && 
        lastSection.type === current.type && 
        current.startTime - lastSection.endTime < GAP_MERGE_THRESHOLD_S
      ) {
        // Merge: extend previous section
        result[result.length - 1] = {
          ...lastSection,
          endTime: current.endTime,
          lyrics: lastSection.lyrics + (current.lyrics ? '\n' + current.lyrics : ''),
          words: [...(lastSection.words || []), ...(current.words || [])],
        };
      } else {
        // Add as new section
        const adjustedSection = {
          ...current,
          startTime: Math.max(current.startTime, currentEnd),
        };
        result.push(adjustedSection);
      }
      
      currentEnd = result[result.length - 1].endTime;
    }
    
    // Extend last section to full duration
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
              "border-l-2 border-r-0 transition-all duration-200 cursor-pointer pointer-events-auto",
              "hover:brightness-110",
              colors.bg,
              colors.border,
              isSelected && "ring-2 ring-primary ring-inset brightness-125 border-primary",
              isActive && !isSelected && "brightness-110 border-white/40"
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
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold truncate max-w-full",
              "bg-background/80 backdrop-blur-sm shadow-sm border border-border/30",
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
                className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-glow"
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
