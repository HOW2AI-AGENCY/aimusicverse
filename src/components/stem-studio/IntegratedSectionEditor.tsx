/**
 * IntegratedSectionEditor - Inline section replacement editor
 * Appears directly below the timeline when a section is selected
 * Professional DAW-style interface for music editing
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { 
  X, Wand2, Zap, Music2, Sparkles, 
  ChevronDown, ChevronUp, Tag, MessageSquare,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement, SECTION_PRESETS } from '@/hooks/useSectionReplacement';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

const containerVariants: Variants = {
  hidden: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  }
};

interface IntegratedSectionEditorProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  onClose: () => void;
}

export function IntegratedSectionEditor({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  onClose,
}: IntegratedSectionEditorProps) {
  const { selectedSection, customRange, editMode, clearSelection } = useSectionEditorStore();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const {
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    isValidDuration,
    isSubmitting,
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    addPreset,
    executeReplacement,
    reset,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    onSuccess: () => {
      clearSelection();
      onClose();
    },
  });

  const handleClose = useCallback(() => {
    reset();
    clearSelection();
    onClose();
  }, [reset, clearSelection, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editMode === 'editing') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, handleClose]);

  const isVisible = editMode === 'editing' && (customRange !== null || selectedSection !== null);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-card/80 to-primary/5 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-4 py-3 space-y-3">
            {/* Header Row */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Wand2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">
                      {selectedSection?.label || 'Выбранная секция'}
                    </h4>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {formatTime(startTime)} — {formatTime(endTime)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sectionDuration.toFixed(1)}с
                    {!isValidDuration && (
                      <span className="text-destructive ml-2">
                        (макс. {maxDuration.toFixed(0)}с)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Audio Preview */}
            {audioUrl && (
              <motion.div variants={itemVariants}>
                <SectionPreviewPlayer
                  audioUrl={audioUrl}
                  startTime={startTime}
                  endTime={endTime}
                  className="bg-muted/30"
                />
              </motion.div>
            )}

            {/* Quick Presets */}
            <motion.div variants={itemVariants}>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs gap-1 transition-all",
                      prompt.includes(preset.prompt) && "bg-primary/10 border-primary/50"
                    )}
                    onClick={() => addPreset(preset.prompt)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Main Input - Prompt */}
            <motion.div variants={itemVariants} className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Опишите желаемые изменения... (энергичнее, добавить гитару, мягче)"
                className={cn(
                  "min-h-[60px] resize-none pr-10",
                  "bg-background/50 border-border/50",
                  "focus:border-primary/50 focus:ring-primary/20"
                )}
              />
              <Sparkles className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/50" />
            </motion.div>

            {/* Advanced Options Collapsible */}
            <motion.div variants={itemVariants}>
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    {isAdvancedOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    Дополнительные настройки
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Стилевые теги
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="rock, energetic, guitar"
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>

                  {/* Lyrics Edit */}
                  {selectedSection?.lyrics && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        Текст секции
                      </label>
                      <Textarea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        placeholder="Отредактируйте текст секции..."
                        className="min-h-[60px] text-sm bg-background/50 resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Изменённый текст будет использован для генерации
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-end gap-2 pt-1"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-9"
              >
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={executeReplacement}
                disabled={!isValidDuration || isSubmitting}
                className="h-9 gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Запуск...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Заменить секцию
                  </>
                )}
              </Button>
            </motion.div>

            {/* Validation Warning */}
            {!isValidDuration && (
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20"
              >
                <Music2 className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">
                  Секция слишком длинная. Максимум — 50% длительности трека ({maxDuration.toFixed(0)} сек)
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
