/**
 * MobileEditTab - Edit tab content for mobile studio
 * Contains: Section timeline, section selection, quick edit actions
 */

import { ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { 
  Scissors, ChevronRight, CheckCircle2, 
  AlertCircle, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';

// Section colors by type
const SECTION_COLORS: Record<string, string> = {
  intro: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  verse: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  chorus: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  bridge: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  outro: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
  default: 'from-primary/20 to-primary/5 border-primary/30',
};

function getSectionColorClass(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('intro')) return SECTION_COLORS.intro;
  if (normalized.includes('verse')) return SECTION_COLORS.verse;
  if (normalized.includes('chorus') || normalized.includes('hook')) return SECTION_COLORS.chorus;
  if (normalized.includes('bridge')) return SECTION_COLORS.bridge;
  if (normalized.includes('outro')) return SECTION_COLORS.outro;
  return SECTION_COLORS.default;
}

interface MobileEditTabProps {
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  selectedIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionSelect: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
  onStartEdit: () => void;
  canEdit?: boolean;
}

export function MobileEditTab({
  sections,
  duration,
  currentTime,
  selectedIndex,
  replacedRanges = [],
  onSectionSelect,
  onSeek,
  onStartEdit,
  canEdit = true,
}: MobileEditTabProps) {
  const isReplaced = (section: DetectedSection) => {
    return replacedRanges.some(r => 
      r.start <= section.endTime && r.end >= section.startTime
    );
  };

  const isCurrent = (section: DetectedSection) => {
    return currentTime >= section.startTime && currentTime <= section.endTime;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Секции трека</h3>
              <p className="text-xs text-muted-foreground">
                {sections.length} секций • {formatTime(duration)}
              </p>
            </div>
          </div>
          
          {selectedIndex !== null && canEdit && (
            <Button
              size="sm"
              onClick={onStartEdit}
              className="h-9 gap-1.5 bg-gradient-to-r from-primary to-primary/80"
            >
              <Scissors className="w-4 h-4" />
              Редактировать
            </Button>
          )}
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Секции не обнаружены
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Воспроизведите трек для анализа структуры
            </p>
          </div>
        ) : (
          sections.map((section, index) => {
            const isSelected = selectedIndex === index;
            const replaced = isReplaced(section);
            const current = isCurrent(section);
            const colorClass = getSectionColorClass(section.type);

            return (
              <motion.button
                key={index}
                onClick={() => onSectionSelect(section, index)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full p-3 rounded-xl border text-left transition-all",
                  "bg-gradient-to-r",
                  colorClass,
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  current && !isSelected && "ring-1 ring-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Play indicator or status */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      current ? "bg-primary/20" : "bg-muted/30"
                    )}>
                      {current ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Play className="w-4 h-4 text-primary" />
                        </motion.div>
                      ) : replaced ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {section.label}
                        </span>
                        {replaced && (
                          <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                            Заменено
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(section.startTime)} — {formatTime(section.endTime)}
                        <span className="text-muted-foreground/60 ml-1">
                          ({(section.endTime - section.startTime).toFixed(1)}с)
                        </span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight className={cn(
                    "w-5 h-5 text-muted-foreground/50 shrink-0 transition-transform",
                    isSelected && "text-primary rotate-90"
                  )} />
                </div>

                {/* Lyrics preview */}
                {section.lyrics && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 pl-11">
                    {section.lyrics}
                  </p>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Bottom hint */}
      {sections.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-border/30 bg-muted/20">
          <p className="text-xs text-center text-muted-foreground">
            Выберите секцию для редактирования
          </p>
        </div>
      )}
    </div>
  );
}
