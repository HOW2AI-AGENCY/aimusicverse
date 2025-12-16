/**
 * Compact Mobile Section Timeline
 * 
 * Minimal height version for mobile Stem Studio
 * Shows only section pills and small progress bar
 */

import { useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileSectionTimelineCompactProps {
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

export function MobileSectionTimelineCompact({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges = [],
  onSectionClick,
  onSeek,
}: MobileSectionTimelineCompactProps) {
  const haptic = useHapticFeedback();

  const handleSectionClick = useCallback((section: DetectedSection, index: number) => {
    haptic.select();
    onSectionClick(section, index);
  }, [onSectionClick, haptic]);

  // Find active section
  const activeIndex = sections.findIndex(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="space-y-2">
      {/* Compact Section Pills - Scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
        {sections.map((section, idx) => {
          const isSelected = selectedIndex === idx;
          const isActive = idx === activeIndex;
          const isReplaced = replacedRanges.some(
            r => Math.abs(r.start - section.startTime) < 1 && Math.abs(r.end - section.endTime) < 1
          );

          return (
            <motion.button
              key={idx}
              onClick={() => handleSectionClick(section, idx)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-medium',
                'border min-h-[36px] transition-all duration-150',
                isSelected && 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20',
                isActive && !isSelected && 'border-primary/40 bg-primary/10',
                !isSelected && !isActive && 'border-border/40 bg-muted/30 text-muted-foreground',
                isReplaced && 'ring-1 ring-success/50'
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', SECTION_COLORS[section.type])} />
                <span className="whitespace-nowrap">{section.label}</span>
                {isReplaced && <span className="text-success text-[10px]">✓</span>}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Timing info for selected section */}
      {selectedIndex !== null && sections[selectedIndex] && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground"
        >
          <span className="font-medium text-foreground">{sections[selectedIndex].label}</span>
          <span>•</span>
          <span className="font-mono">
            {formatTime(sections[selectedIndex].startTime)} - {formatTime(sections[selectedIndex].endTime)}
          </span>
          <span>•</span>
          <span>{Math.round(sections[selectedIndex].endTime - sections[selectedIndex].startTime)}с</span>
        </motion.div>
      )}
    </div>
  );
}

export default MobileSectionTimelineCompact;
