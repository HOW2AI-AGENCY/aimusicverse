/**
 * Mobile-optimized section editor as bottom sheet
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSectionReplacement } from '@/hooks/useSectionReplacement';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection, DetectedSection } from '@/hooks/useSectionDetection';
import { SectionWaveformPreview } from '../SectionWaveformPreview';
import { SectionPreviewPlayer } from '../SectionPreviewPlayer';
import { SectionPicker } from '../SectionPicker';
import {
  SectionPresets,
  SectionLyricsEditor,
  SectionValidation,
  SectionActions,
} from '../section-editor';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SectionEditorMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackLyrics?: string | null;
  audioUrl?: string | null;
  duration: number;
  taskId?: string | null;
  audioId?: string | null;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SectionEditorMobile({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  trackTags,
  trackLyrics,
  audioUrl,
  duration,
  taskId,
  audioId,
}: SectionEditorMobileProps) {
  // Validate that track has required Suno IDs for section replacement
  const hasSunoData = Boolean(taskId && audioId);

  const { data: lyricsData } = useTimestampedLyrics(taskId || null, audioId || null);
  const detectedSections = useSectionDetection(trackLyrics, lyricsData?.alignedWords, duration);

  const {
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    selectedSection,
    isValidDuration,
    isSubmitting,
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    selectSection,
    updateRange,
    addPreset,
    executeReplacement,
    reset,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    detectedSections,
    onSuccess: () => onOpenChange(false),
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Early validation state
  const durationValid = duration > 0;
  const canReplace = hasSunoData && durationValid && isValidDuration;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="pb-2 flex-shrink-0">
          <DrawerTitle className="flex items-center gap-3">
            <motion.div 
              className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 hsl(var(--primary) / 0.3)', 
                  '0 0 0 6px hsl(var(--primary) / 0)', 
                ] 
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <div className="text-left">
              <span className="flex items-center gap-2">
                Заменить секцию
                {selectedSection && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedSection.label}
                  </Badge>
                )}
              </span>
              <p className="text-xs font-normal text-muted-foreground font-mono">
                {formatTime(startTime)} — {formatTime(endTime)}
              </p>
            </div>
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-4 space-y-3 pb-safe">
            {/* Waveform - compact */}
            <SectionWaveformPreview
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              isValid={isValidDuration}
              interactive
              onSelectionChange={updateRange}
              className="h-14"
            />

            {/* Section Picker - horizontal scroll */}
            {detectedSections.length > 0 && (
              <SectionPicker
                sections={detectedSections}
                selectedIndex={detectedSections.findIndex(
                  s => Math.abs(s.startTime - startTime) < 0.5 && Math.abs(s.endTime - endTime) < 0.5
                )}
                maxDuration={maxDuration}
                onSelect={selectSection}
              />
            )}

            {/* Validation - only show if there's an issue */}
            {(!durationValid || !isValidDuration) && (
              <SectionValidation
                isValid={durationValid && isValidDuration}
                sectionDuration={sectionDuration}
                maxDuration={maxDuration || 60}
                compact
              />
            )}

            {/* Warning if track doesn't have Suno data */}
            {!hasSunoData && (
              <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Замена секций недоступна — трек не был сгенерирован через Suno AI.
                </AlertDescription>
              </Alert>
            )}

            {/* Warning if duration not loaded */}
            {hasSunoData && !durationValid && (
              <Alert className="border-amber-500/50 bg-amber-500/10 py-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs">
                  Загрузка аудио... Подождите пока длительность трека определится.
                </AlertDescription>
              </Alert>
            )}

            {/* Presets - compact grid */}
            {hasSunoData && <SectionPresets onSelect={addPreset} compact />}

            {/* Prompt - smaller */}
            {hasSunoData && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Описание стиля</Label>
                <Textarea
                  placeholder="Более энергичный, с электро-гитарой..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[40px] resize-none text-sm"
                  rows={2}
                />
              </div>
            )}

            {/* Tags - compact */}
            {hasSunoData && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Стиль
                </Label>
                <Input
                  placeholder="rock, guitar, energetic..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {/* Actions */}
            {hasSunoData && (
              <SectionActions
                onReplace={executeReplacement}
                onCancel={handleClose}
                isValid={canReplace}
                isSubmitting={isSubmitting}
                compact
              />
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
