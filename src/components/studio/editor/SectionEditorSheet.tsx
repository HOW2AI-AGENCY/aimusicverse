/**
 * Section Editor Sheet
 * 
 * Bottom sheet on mobile, inline panel on desktop
 * For editing and replacing track sections
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  X, Wand2, Zap, Sparkles, 
  ChevronDown, ChevronUp, Tag, MessageSquare,
  Loader2, Play, Pause, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement, SECTION_PRESETS } from '@/hooks/useSectionReplacement';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef } from 'react';

interface SectionEditorSheetProps {
  open: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  detectedSections: DetectedSection[];
}

export function SectionEditorSheet({
  open,
  onClose,
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  detectedSections,
}: SectionEditorSheetProps) {
  const isMobile = useIsMobile();
  const { selectedSection, customRange, clearSelection, setCustomRange } = useSectionEditorStore();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

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
    detectedSections,
    onSuccess: () => {
      handleClose();
    },
  });

  const handleClose = useCallback(() => {
    reset();
    clearSelection();
    setIsPreviewPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    onClose();
  }, [reset, clearSelection, onClose]);

  // Preview audio controls
  useEffect(() => {
    if (!audioUrl || !open) return;
    
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    previewAudioRef.current = audio;

    audio.addEventListener('ended', () => setIsPreviewPlaying(false));
    audio.addEventListener('pause', () => setIsPreviewPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
      previewAudioRef.current = null;
    };
  }, [audioUrl, open]);

  const togglePreview = useCallback(() => {
    if (!previewAudioRef.current) return;
    
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.currentTime = startTime;
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
      
      // Stop at end time
      const checkEnd = setInterval(() => {
        if (previewAudioRef.current && previewAudioRef.current.currentTime >= endTime) {
          previewAudioRef.current.pause();
          setIsPreviewPlaying(false);
          clearInterval(checkEnd);
        }
      }, 100);
    }
  }, [isPreviewPlaying, startTime, endTime]);

  // Handle range adjustment
  const handleStartChange = useCallback((value: number[]) => {
    const newStart = value[0];
    if (newStart < endTime - 1) {
      setCustomRange(newStart, endTime);
    }
  }, [endTime, setCustomRange]);

  const handleEndChange = useCallback((value: number[]) => {
    const newEnd = value[0];
    if (newEnd > startTime + 1) {
      setCustomRange(startTime, newEnd);
    }
  }, [startTime, setCustomRange]);

  // Editor content
  const editorContent = (
    <div className="space-y-4 p-4">
      {/* Section info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {selectedSection?.label || 'Выбранная секция'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {sectionDuration.toFixed(1)}с
              {!isValidDuration && (
                <span className="text-destructive ml-2">(макс. {maxDuration.toFixed(0)}с)</span>
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {formatTime(startTime)} — {formatTime(endTime)}
        </Badge>
      </div>

      {/* Preview player */}
      {audioUrl && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePreview}
          >
            {isPreviewPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <div className="flex-1">
            <p className="text-xs font-medium">Прослушать секцию</p>
            <p className="text-[10px] text-muted-foreground">
              {formatTime(startTime)} — {formatTime(endTime)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (previewAudioRef.current) {
                previewAudioRef.current.currentTime = startTime;
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Range adjustment */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Начало</span>
            <span className="font-mono">{formatTime(startTime)}</span>
          </div>
          <Slider
            value={[startTime]}
            onValueChange={handleStartChange}
            min={0}
            max={duration}
            step={0.1}
            className="py-2"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Конец</span>
            <span className="font-mono">{formatTime(endTime)}</span>
          </div>
          <Slider
            value={[endTime]}
            onValueChange={handleEndChange}
            min={0}
            max={duration}
            step={0.1}
            className="py-2"
          />
        </div>
      </div>

      {/* Quick presets */}
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

      {/* Prompt input */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите желаемые изменения... (энергичнее, добавить гитару, мягче)"
          className={cn(
            "min-h-[80px] resize-none pr-10",
            "bg-background/50 border-border/50",
            "focus:border-primary/50 focus:ring-primary/20"
          )}
        />
        <Sparkles className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/50" />
      </div>

      {/* Advanced options */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Дополнительные настройки
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
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

          {lyrics && (
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
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Validation warning */}
      {!isValidDuration && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">
            Секция слишком длинная. Максимум — 50% длительности трека ({maxDuration.toFixed(0)} сек)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Отмена
        </Button>
        <Button
          onClick={executeReplacement}
          disabled={!isValidDuration || isSubmitting}
          className="flex-1 gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Заменить
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              Заменить секцию
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {editorContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: inline panel
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-card/80 to-primary/5 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 max-w-2xl mx-auto">
              {editorContent}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="m-2"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
