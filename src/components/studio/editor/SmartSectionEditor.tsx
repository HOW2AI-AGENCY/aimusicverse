/**
 * SmartSectionEditor - Unified adaptive section editor
 * Desktop: inline panel below timeline
 * Mobile: slide-up sheet (50% screen)
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { 
  X, Wand2, Zap, Sparkles, 
  ChevronDown, ChevronUp, Tag, MessageSquare,
  Loader2, Play, Pause, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement, SECTION_PRESETS } from '@/hooks/useSectionReplacement';
import { SectionPreviewPlayer } from '@/components/stem-studio/SectionPreviewPlayer';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface SmartSectionEditorProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackLyrics?: string | null;
  audioUrl?: string | null;
  duration: number;
  onClose: () => void;
}

// Editor Form Content - shared between desktop and mobile
function EditorContent({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  onClose,
  isMobile,
}: SmartSectionEditorProps & { isMobile: boolean }) {
  const { selectedSection, customRange, clearSelection } = useSectionEditorStore();
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

  return (
    <div className={cn("space-y-4", isMobile ? "p-4" : "px-4 py-3")}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-base truncate">
                {selectedSection?.label || 'Выбранная секция'}
              </h4>
              <Badge 
                variant="outline" 
                className="text-xs bg-muted/50 border-border/50"
              >
                {formatTime(startTime)} — {formatTime(endTime)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Длительность: {sectionDuration.toFixed(1)} сек
              {!isValidDuration && (
                <span className="text-destructive ml-2">
                  (макс. {maxDuration.toFixed(0)} сек)
                </span>
              )}
            </p>
          </div>
        </div>

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <div className="rounded-xl bg-muted/30 border border-border/50 overflow-hidden">
          <SectionPreviewPlayer
            audioUrl={audioUrl}
            startTime={startTime}
            endTime={endTime}
            className="bg-transparent"
          />
        </div>
      )}

      {/* Quick Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Быстрые пресеты
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTION_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 transition-all rounded-full",
                "hover:bg-primary/10 hover:border-primary/50",
                prompt.includes(preset.prompt) && "bg-primary/15 border-primary/50 text-primary"
              )}
              onClick={() => addPreset(preset.prompt)}
            >
              <Sparkles className="w-3 h-3" />
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Input - Prompt */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Опишите изменения
        </label>
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Энергичнее, добавить гитару, мягче, больше баса..."
            className={cn(
              "min-h-[80px] resize-none pr-10",
              "bg-background/80 border-border/50 rounded-xl",
              "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
              "placeholder:text-muted-foreground/60"
            )}
          />
          <Sparkles className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/30" />
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            {isAdvancedOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Дополнительные настройки
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Tag className="w-3.5 h-3.5" />
              Стилевые теги
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rock, energetic, guitar solo"
              className="h-9 text-sm bg-background/80 rounded-lg"
            />
          </div>

          {/* Lyrics Edit */}
          {selectedSection?.lyrics && (
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                Текст секции
              </label>
              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Отредактируйте текст секции..."
                className="min-h-[80px] text-sm bg-background/80 resize-none rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">
                Изменённый текст будет использован для генерации
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Validation Warning */}
      {!isValidDuration && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <Wand2 className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            Секция слишком длинная. Максимум — 50% длительности трека
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-10 px-4 rounded-lg"
        >
          Отмена
        </Button>
        <Button
          size="sm"
          onClick={executeReplacement}
          disabled={!isValidDuration || isSubmitting || !prompt.trim()}
          className={cn(
            "h-10 px-6 gap-2 min-w-[160px] rounded-lg",
            "bg-gradient-to-r from-primary to-primary/90",
            "hover:from-primary/90 hover:to-primary/80",
            "shadow-lg shadow-primary/25"
          )}
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
      </div>
    </div>
  );
}

export function SmartSectionEditor(props: SmartSectionEditorProps) {
  const isMobile = useIsMobile();
  const { editMode, clearSelection } = useSectionEditorStore();
  
  const isVisible = editMode === 'editing';

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editMode === 'editing') {
        props.onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, props.onClose]);

  // Mobile: Sheet from bottom
  if (isMobile) {
    return (
      <Sheet open={isVisible} onOpenChange={(open) => !open && props.onClose()}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] rounded-t-3xl p-0 border-t-2 border-primary/20"
        >
          <div className="pt-2 pb-1 flex justify-center">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
          <SheetHeader className="px-4 pb-2 border-b border-border/50">
            <SheetTitle className="text-left">Редактор секции</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            <EditorContent {...props} isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Inline panel
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            "border-b border-primary/20 overflow-hidden",
            "bg-gradient-to-r from-primary/5 via-card/95 to-primary/5",
            "backdrop-blur-sm"
          )}
        >
          <motion.div variants={itemVariants}>
            <EditorContent {...props} isMobile={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
