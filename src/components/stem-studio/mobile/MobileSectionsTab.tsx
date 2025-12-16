/**
 * Mobile Sections Tab
 * 
 * Section selection and replacement for mobile
 */

import { motion } from '@/lib/motion';
import { Scissors, Play, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import type { DetectedSection } from '@/hooks/useSectionDetection';

interface MobileSectionsTabProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges: Array<{ start: number; end: number }>;
  onSectionSelect: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
  onStartReplace: () => void;
}

const sectionColors: Record<string, string> = {
  'Intro': 'bg-purple-500/20 border-purple-500/50 text-purple-500',
  'Verse': 'bg-blue-500/20 border-blue-500/50 text-blue-500',
  'Pre-Chorus': 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500',
  'Chorus': 'bg-amber-500/20 border-amber-500/50 text-amber-500',
  'Bridge': 'bg-green-500/20 border-green-500/50 text-green-500',
  'Outro': 'bg-rose-500/20 border-rose-500/50 text-rose-500',
  'Hook': 'bg-orange-500/20 border-orange-500/50 text-orange-500',
};

// formatTime imported from @/lib/player-utils

export function MobileSectionsTab({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges,
  onSectionSelect,
  onSeek,
  onStartReplace,
}: MobileSectionsTabProps) {
  const isReplaced = (start: number, end: number) => 
    replacedRanges.some(r => 
      Math.abs(r.start - start) < 0.5 && Math.abs(r.end - end) < 0.5
    );

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Scissors className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Секции не найдены</h3>
        <p className="text-sm text-muted-foreground">
          Для автоматического определения секций нужен синхронизированный текст
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Секции трека</h3>
          <p className="text-xs text-muted-foreground">Выберите секцию для замены AI</p>
        </div>
        {selectedIndex !== null && (
          <Button 
            size="sm" 
            onClick={onStartReplace}
            className="gap-1"
          >
            <Scissors className="w-4 h-4" />
            Заменить
          </Button>
        )}
      </div>

      {sections.map((section, index) => {
        const isSelected = selectedIndex === index;
        const replaced = isReplaced(section.startTime, section.endTime);
        const isActive = currentTime >= section.startTime && currentTime <= section.endTime;
        const colorClass = sectionColors[section.type] || 'bg-gray-500/20 border-gray-500/50 text-gray-500';

        return (
          <motion.button
            key={`${section.type}-${index}`}
            onClick={() => onSectionSelect(section, index)}
            className={cn(
              "w-full p-3 rounded-xl text-left transition-all border-2",
              "flex items-center gap-3",
              isSelected 
                ? "border-primary bg-primary/10" 
                : replaced 
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-border/50 bg-card/50",
              isActive && !isSelected && "ring-2 ring-primary/50"
            )}
            whileTap={{ scale: 0.98 }}
          >
            {/* Section Type Badge */}
            <div className={cn(
              "px-2 py-1 rounded-md text-xs font-medium border",
              colorClass
            )}>
              {section.type}
            </div>

            {/* Section Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(section.startTime)} - {formatTime(section.endTime)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({formatTime(section.endTime - section.startTime)})
                </span>
              </div>
              {section.lyrics && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {section.lyrics.slice(0, 50)}...
                </p>
              )}
            </div>

            {/* Status */}
            {replaced && (
              <Badge variant="secondary" className="gap-1 text-green-500 bg-green-500/10">
                <Check className="w-3 h-3" />
                Заменено
              </Badge>
            )}

            {/* Play Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onSeek(section.startTime);
              }}
              className="h-8 w-8 rounded-full flex-shrink-0"
            >
              <Play className="w-4 h-4" />
            </Button>
          </motion.button>
        );
      })}
    </div>
  );
}
