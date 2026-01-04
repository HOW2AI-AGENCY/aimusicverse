/**
 * Mobile-optimized section editor - Full screen overlay
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/player-utils';
import { useSectionReplacement } from '@/hooks/useSectionReplacement';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection, DetectedSection } from '@/hooks/useSectionDetection';
import { SectionWaveformPreview } from '../SectionWaveformPreview';
import { SectionPicker } from '../SectionPicker';
import { SectionPreviewPlayer } from '../SectionPreviewPlayer';
import {
  SectionPresets,
  SectionValidation,
  SectionActions,
} from '../section-editor';
import { SectionReplacementProgress } from '@/components/generation/SectionReplacementProgress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Sparkles, AlertCircle, X, ChevronLeft } from 'lucide-react';
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

// formatTime imported from @/lib/player-utils

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
    progress: sectionProgress,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    detectedSections,
    onSuccess: () => {}, // Don't close on success, let progress UI handle it
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Early validation state
  const durationValid = duration > 0;
  const canReplace = hasSunoData && durationValid && isValidDuration && sectionDuration > 0;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[90] bg-background flex flex-col"
        >
          {/* Header */}
          <header className="flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3 safe-area-top">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClose}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center"
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
                <div>
                  <h1 className="font-semibold text-base">Заменить секцию</h1>
                  {selectedSection && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSection.label}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClose}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Time Range Display */}
            <div className="px-4 pb-3 flex items-center justify-center gap-4">
              <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                {formatTime(startTime)}
              </Badge>
              <span className="text-muted-foreground">—</span>
              <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                {formatTime(endTime)}
              </Badge>
              <Badge 
                variant={isValidDuration ? 'secondary' : 'destructive'} 
                className="font-mono text-sm px-3 py-1"
              >
                {sectionDuration.toFixed(1)}s
              </Badge>
            </div>
          </header>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="px-4 py-4 space-y-5 pb-32">
              {/* Waveform Preview */}
              <section className="space-y-2">
                <Label className="text-sm font-medium">Выбор участка</Label>
                <SectionWaveformPreview
                  duration={duration}
                  startTime={startTime}
                  endTime={endTime}
                  isValid={isValidDuration}
                  interactive
                  onSelectionChange={updateRange}
                  className="h-20 rounded-xl"
                />
              </section>

              {/* Audio Preview Player */}
              {audioUrl && startTime > 0 && endTime > startTime && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium">Прослушать секцию</Label>
                  <SectionPreviewPlayer
                    audioUrl={audioUrl}
                    startTime={startTime}
                    endTime={endTime}
                    className="rounded-xl"
                  />
                </section>
              )}

              {/* Section Picker */}
              {detectedSections.length > 0 && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium">Секции трека</Label>
                  <SectionPicker
                    sections={detectedSections}
                    selectedIndex={detectedSections.findIndex(
                      s => Math.abs(s.startTime - startTime) < 0.5 && Math.abs(s.endTime - endTime) < 0.5
                    )}
                    maxDuration={maxDuration}
                    onSelect={selectSection}
                  />
                </section>
              )}

              {/* Validation Messages */}
              {(!durationValid || !isValidDuration || sectionDuration === 0) && (
                <SectionValidation
                  isValid={durationValid && isValidDuration && sectionDuration > 0}
                  sectionDuration={sectionDuration}
                  maxDuration={maxDuration || 60}
                />
              )}

              {/* Warning if track doesn't have Suno data */}
              {!hasSunoData && (
                <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Замена секций недоступна — трек не был сгенерирован через Suno AI.
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning if duration not loaded */}
              {hasSunoData && !durationValid && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    Загрузка аудио... Подождите пока длительность трека определится.
                  </AlertDescription>
                </Alert>
              )}

              {/* Style Presets */}
              {hasSunoData && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium">Быстрый выбор стиля</Label>
                  <SectionPresets onSelect={addPreset} />
                </section>
              )}

              {/* Style Description */}
              {hasSunoData && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium">Описание нового звучания</Label>
                  <Textarea
                    placeholder="Опишите как должна звучать новая секция... Например: более энергичный ритм, добавить электро-гитару, усилить бас"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                    rows={4}
                  />
                </section>
              )}

              {/* Tags */}
              {hasSunoData && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Теги стиля
                  </Label>
                  <Input
                    placeholder="rock, guitar, energetic, powerful drums..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Музыкальные теги через запятую для более точной генерации
                  </p>
                </section>
              )}

              {/* Current Section Lyrics */}
              {hasSunoData && lyrics && (
                <section className="space-y-2">
                  <Label className="text-sm font-medium">Текст секции</Label>
                  <Textarea
                    placeholder="Текст для новой секции..."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    className="min-h-[80px] resize-none font-mono text-sm"
                    rows={3}
                  />
                </section>
              )}
            </div>
          </ScrollArea>

          {/* Progress or Actions */}
          {hasSunoData && (
            <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm p-4 safe-area-bottom">
              {sectionProgress.status !== 'idle' ? (
                <SectionReplacementProgress
                  status={sectionProgress.status}
                  progress={sectionProgress.progress}
                  message={sectionProgress.message}
                  error={sectionProgress.error}
                  variants={sectionProgress.variants}
                  section={sectionProgress.section}
                  onSelectVariant={sectionProgress.selectVariant}
                  onRetry={executeReplacement}
                  onDismiss={() => {
                    sectionProgress.reset();
                    onOpenChange(false);
                  }}
                />
              ) : (
                <SectionActions
                  onReplace={executeReplacement}
                  onCancel={handleClose}
                  isValid={canReplace}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
