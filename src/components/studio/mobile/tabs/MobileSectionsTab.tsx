/**
 * MobileSectionsTab - Section replacement for mobile
 *
 * Features:
 * - View detected sections (Verse, Chorus, etc.)
 * - Select and replace sections
 * - A/B comparison
 */

import { useState } from 'react';
import { Scissors, Layers, Play, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTracks } from '@/hooks/useTracks';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection } from '@/hooks/useSectionDetection';
import { useReplacedSections } from '@/hooks/useReplacedSections';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

interface MobileSectionsTabProps {
  trackId?: string;
  mode: 'track' | 'project';
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function MobileSectionsTab({
  trackId,
  mode,
  duration,
  currentTime,
  onSeek
}: MobileSectionsTabProps) {
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  const { data: lyricsData } = useTimestampedLyrics(
    track?.suno_task_id || null,
    track?.suno_id || null
  );
  const detectedSections = useSectionDetection(
    track?.lyrics,
    lyricsData?.alignedWords,
    duration
  );
  const { data: replacedSections } = useReplacedSections(trackId || '');

  const { selectSection, selectedSectionIndex } = useSectionEditorStore();

  const canReplaceSection = track?.suno_id && track?.suno_task_id;

  if (mode === 'track' && !track) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Трек не найден</p>
      </div>
    );
  }

  if (!canReplaceSection) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription className="text-xs">
            Замена секций недоступна для этого трека.
            Только треки, сгенерированные с Suno, поддерживают замену секций.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Секции
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Выберите секцию для замены
          </p>
        </div>
      </div>

      {/* Info */}
      {detectedSections.length === 0 && (
        <Alert>
          <AlertDescription className="text-xs">
            Секции не обнаружены. Убедитесь, что трек имеет текст с тегами секций
            ([Verse], [Chorus], и т.д.).
          </AlertDescription>
        </Alert>
      )}

      {/* Sections List */}
      {detectedSections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Обнаружено секций: {detectedSections.length}
            </h4>
            {replacedSections && replacedSections.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {replacedSections.length} заменено
              </Badge>
            )}
          </div>

          {detectedSections.map((section, index) => {
            const isSelected = selectedSectionIndex === index;
            const isActive =
              currentTime >= section.startTime && currentTime <= section.endTime;
            const isReplaced = replacedSections?.some(
              r => r.start === section.startTime && r.end === section.endTime
            );

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  selectSection(section, index);
                  onSeek(section.startTime);
                }}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all text-left",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : isActive
                    ? "bg-accent/50 border-accent"
                    : "bg-card border-border/50 hover:bg-accent/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}
                  >
                    <Scissors className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {section.label || `Section ${index + 1}`}
                      </p>
                      {isReplaced && (
                        <Badge variant="secondary" className="text-[9px] h-4">
                          Заменено
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="default" className="text-[9px] h-4">
                          <Play className="w-2.5 h-2.5 mr-0.5" />
                          Играет
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(section.startTime);
                    }}
                    className="h-8 w-8 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {section.lyrics && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {section.lyrics}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {selectedSectionIndex !== null && (
        <div className="pt-4 border-t border-border/30">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              // TODO: Open section replacement dialog
            }}
          >
            <Wand2 className="w-4 h-4" />
            Заменить выбранную секцию
          </Button>
        </div>
      )}
    </div>
  );
}
