/**
 * MobileSectionsView
 * Mobile-friendly list of detected song sections
 * Tapping a section opens the section editor
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Scissors, Check, Clock, Play, Pause, Music2,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import type { DetectedSection } from '@/hooks/useSectionDetection';

interface ReplacedRange {
  start: number;
  end: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface MobileSectionsViewProps {
  sections: DetectedSection[];
  replacedRanges: ReplacedRange[];
  currentTime: number;
  isPlaying: boolean;
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

// Section type colors
const SECTION_COLORS: Record<DetectedSection['type'], string> = {
  'verse': 'bg-blue-500',
  'chorus': 'bg-purple-500',
  'bridge': 'bg-amber-500',
  'intro': 'bg-green-500',
  'outro': 'bg-rose-500',
  'pre-chorus': 'bg-cyan-500',
  'hook': 'bg-pink-500',
  'unknown': 'bg-muted-foreground',
};

const SECTION_BG: Record<DetectedSection['type'], string> = {
  'verse': 'bg-blue-500/10 hover:bg-blue-500/20',
  'chorus': 'bg-purple-500/10 hover:bg-purple-500/20',
  'bridge': 'bg-amber-500/10 hover:bg-amber-500/20',
  'intro': 'bg-green-500/10 hover:bg-green-500/20',
  'outro': 'bg-rose-500/10 hover:bg-rose-500/20',
  'pre-chorus': 'bg-cyan-500/10 hover:bg-cyan-500/20',
  'hook': 'bg-pink-500/10 hover:bg-pink-500/20',
  'unknown': 'bg-muted/10 hover:bg-muted/20',
};

export const MobileSectionsView = memo(function MobileSectionsView({
  sections,
  replacedRanges,
  currentTime,
  isPlaying,
  onSectionClick,
  onSeek,
  onPlayPause,
}: MobileSectionsViewProps) {

  // Check if section is currently playing
  const isActiveSection = useCallback((section: DetectedSection): boolean => {
    return currentTime >= section.startTime && currentTime < section.endTime;
  }, [currentTime]);

  // Check if section has been replaced
  const getSectionStatus = useCallback((section: DetectedSection): ReplacedRange | null => {
    return replacedRanges.find(range => {
      const overlap = Math.max(0, Math.min(section.endTime, range.end) - Math.max(section.startTime, range.start));
      const sectionDuration = section.endTime - section.startTime;
      return overlap > sectionDuration * 0.5;
    }) || null;
  }, [replacedRanges]);

  // Play section from start
  const playSection = useCallback((section: DetectedSection, e: React.MouseEvent) => {
    e.stopPropagation();
    onSeek(section.startTime);
    if (!isPlaying) {
      setTimeout(() => onPlayPause(), 100);
    }
  }, [onSeek, isPlaying, onPlayPause]);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Music2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Секции не найдены</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Секции определяются автоматически из лирики трека или по паузам в аудио
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Секции
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sections.length} секций • нажмите для редактирования
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {replacedRanges.filter(r => r.status === 'completed').length} заменено
          </Badge>
        </div>
      </div>

      {/* Sections list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-2 pb-20">
          <AnimatePresence initial={false}>
            {sections.map((section, index) => {
              const isActive = isActiveSection(section);
              const replacement = getSectionStatus(section);
              const duration = section.endTime - section.startTime;
              const color = SECTION_COLORS[section.type];
              const bgColor = SECTION_BG[section.type];

              return (
                <motion.button
                  key={`${section.type}-${section.startTime}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSectionClick(section, index)}
                  className={cn(
                    "w-full p-4 rounded-xl border transition-all text-left",
                    bgColor,
                    isActive 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Color indicator */}
                    <div className={cn(
                      "w-1.5 h-full min-h-[40px] rounded-full shrink-0",
                      color
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{section.label}</span>
                        
                        {replacement?.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px]">
                            <Check className="w-3 h-3 mr-0.5" />
                            Заменено
                          </Badge>
                        )}
                        
                        {replacement?.status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-[10px]">
                            <Clock className="w-3 h-3 mr-0.5 animate-pulse" />
                            В очереди
                          </Badge>
                        )}
                        
                        {replacement?.status === 'processing' && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[10px]">
                            <Sparkles className="w-3 h-3 mr-0.5 animate-spin" />
                            Генерация
                          </Badge>
                        )}
                      </div>

                      {/* Time info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {formatTime(section.startTime)} – {formatTime(section.endTime)}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{Math.round(duration)}с</span>
                      </div>

                      {/* Lyrics preview */}
                      {section.lyrics && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                          "{section.lyrics.slice(0, 100)}{section.lyrics.length > 100 ? '...' : ''}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => playSection(section, e)}
                      >
                        {isActive && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
});
