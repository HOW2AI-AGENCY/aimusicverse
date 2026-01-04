/**
 * Compact horizontal section picker for detected sections
 */

import { motion } from '@/lib/motion';
import { AlertTriangle } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

interface SectionPickerProps {
  sections: DetectedSection[];
  selectedIndex: number;
  maxDuration: number;
  onSelect: (index: number) => void;
}

const SECTION_COLORS: Record<DetectedSection['type'], string> = {
  'verse': 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  'chorus': 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  'bridge': 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  'intro': 'bg-green-500/20 border-green-500/50 text-green-400',
  'outro': 'bg-rose-500/20 border-rose-500/50 text-rose-400',
  'pre-chorus': 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  'hook': 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  'unknown': 'bg-muted border-border text-muted-foreground',
};

// formatTime imported from @/lib/player-utils

export function SectionPicker({
  sections,
  selectedIndex,
  maxDuration,
  onSelect,
}: SectionPickerProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Выберите секцию</p>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {sections.map((section, idx) => {
            const isSelected = selectedIndex === idx;
            const sectionLen = section.endTime - section.startTime;
            const isTooLong = sectionLen > maxDuration;

            return (
              <motion.button
                key={idx}
                onClick={() => onSelect(idx)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-all min-w-[100px]",
                  "hover:ring-2 hover:ring-primary/50",
                  SECTION_COLORS[section.type],
                  isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-xs truncate">
                    {section.label}
                  </span>
                  {isTooLong && (
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] opacity-70 font-mono mt-0.5">
                  {formatTime(section.startTime)} — {formatTime(section.endTime)}
                </p>
              </motion.button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
