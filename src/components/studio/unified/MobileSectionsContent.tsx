/**
 * MobileSectionsContent - Section replacement for mobile studio
 * Displays detected sections with replace functionality
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Scissors, Layers, Play, Wand2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionEditorSheet } from '@/components/studio/editor/SectionEditorSheet';
import { formatTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';

interface DetectedSection {
  label: string;
  startTime: number;
  endTime: number;
  lyrics?: string;
}

interface MobileSectionsContentProps {
  project: StudioProject;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const MobileSectionsContent = memo(function MobileSectionsContent({
  project,
  currentTime,
  onSeek,
}: MobileSectionsContentProps) {
  const [selectedTrack, setSelectedTrack] = useState<StudioTrack | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // For now, use first track (can expand to track selector later)
  const mainTrack = project.tracks[0];

  // Mock detected sections - in real app would come from lyrics parsing
  const detectedSections: DetectedSection[] = [];

  const handleSelectSection = useCallback((section: DetectedSection, index: number) => {
    setSelectedSectionIndex(index);
    onSeek(section.startTime);
  }, [onSeek]);

  const handleOpenEditor = useCallback(() => {
    if (mainTrack && selectedSectionIndex !== null) {
      setSelectedTrack(mainTrack);
      setShowEditor(true);
    }
  }, [mainTrack, selectedSectionIndex]);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setSelectedTrack(null);
    setSelectedSectionIndex(null);
  }, []);

  if (!mainTrack) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground text-sm">Добавьте дорожку для работы с секциями</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4 pb-20">
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

        {/* Info when no sections */}
        {detectedSections.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Секции не обнаружены. Для автоматического определения секций 
              добавьте текст с тегами ([Verse], [Chorus], и т.д.) или используйте 
              ручной выбор региона.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual section selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Ручной выбор
          </h4>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              setSelectedTrack(mainTrack);
              setShowEditor(true);
            }}
          >
            <Scissors className="w-4 h-4" />
            Выбрать регион на waveform
          </Button>
        </div>

        {/* Sections List */}
        {detectedSections.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Обнаружено секций: {detectedSections.length}
              </h4>
            </div>

            {detectedSections.map((section, index) => {
              const isSelected = selectedSectionIndex === index;
              const isActive = currentTime >= section.startTime && currentTime <= section.endTime;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectSection(section, index)}
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
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Scissors className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {section.label || `Section ${index + 1}`}
                        </p>
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
              onClick={handleOpenEditor}
            >
              <Wand2 className="w-4 h-4" />
              Заменить выбранную секцию
            </Button>
          </div>
        )}
      </div>

      {/* Section Editor Sheet */}
      {selectedTrack && (
        <SectionEditorSheet
          open={showEditor}
          onClose={handleCloseEditor}
          trackId={selectedTrack.id}
          trackTitle={selectedTrack.name}
          audioUrl={selectedTrack.audioUrl || selectedTrack.clips?.[0]?.audioUrl}
          duration={selectedTrack.clips?.[0]?.duration || selectedTrack.versions?.[0]?.duration || 60}
          detectedSections={[]}
        />
      )}
    </>
  );
});
