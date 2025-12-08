import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  X, Wand2, Loader2, FileText, ChevronDown, 
  AlertTriangle, Sparkles, Zap, Headphones
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { SectionWaveformPreview } from './SectionWaveformPreview';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import { cn } from '@/lib/utils';

// Animation variants
const sectionPillVariants: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 10 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 350,
      damping: 25
    }
  }),
  selected: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

const presetVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.2 + i * 0.03,
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }),
  tap: { scale: 0.95 }
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

interface SectionEditorMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  sections: DetectedSection[];
}

const PROMPT_PRESETS = [
  { label: '⚡ Энергичнее', prompt: 'more energetic, higher tempo, powerful' },
  { label: '🎵 Мягче', prompt: 'softer, gentler, acoustic feel' },
  { label: '🎬 Эпичнее', prompt: 'epic, orchestral, cinematic' },
  { label: '🎹 Минимал', prompt: 'minimal, stripped down, simple' },
  { label: '🎸 Рок', prompt: 'rock style, distorted guitar, drums' },
  { label: '🎤 Акустика', prompt: 'acoustic, unplugged, natural' },
];

export function SectionEditorMobile({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  sections,
}: SectionEditorMobileProps) {
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(0);
  const haptic = useHapticFeedback();
  
  const {
    selectedSection,
    selectedSectionIndex,
    customRange,
    editedLyrics,
    prompt,
    tags,
    selectSection,
    setCustomRange,
    setEditedLyrics,
    setPrompt,
    setTags,
    setActiveTask,
    clearSelection,
  } = useSectionEditorStore();

  const replaceMutation = useReplaceSectionMutation();

  // Sync local state with store
  useEffect(() => {
    if (customRange) {
      setLocalStart(customRange.start);
      setLocalEnd(customRange.end);
    } else if (selectedSection) {
      setLocalStart(selectedSection.startTime);
      setLocalEnd(selectedSection.endTime);
    }
  }, [customRange, selectedSection]);

  // Initialize tags
  useEffect(() => {
    if (trackTags && !tags) {
      setTags(trackTags);
    }
  }, [trackTags, tags, setTags]);

  const startTime = localStart;
  const endTime = localEnd;
  const sectionDuration = endTime - startTime;
  const maxDuration = duration * 0.5;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRangeChange = useCallback((values: number[]) => {
    const [start, end] = values;
    setLocalStart(start);
    setLocalEnd(end);
    setCustomRange(start, end);
    haptic.selectionChanged();
  }, [setCustomRange, haptic]);

  const handleWaveformSelectionChange = useCallback((start: number, end: number) => {
    setLocalStart(start);
    setLocalEnd(end);
    setCustomRange(start, end);
    haptic.selectionChanged();
  }, [setCustomRange, haptic]);

  const handleSectionSelect = useCallback((section: DetectedSection, index: number) => {
    haptic.select();
    const sectionLen = section.endTime - section.startTime;
    if (sectionLen > maxDuration) {
      selectSection({ ...section, endTime: section.startTime + maxDuration }, index);
    } else {
      selectSection(section, index);
    }
  }, [selectSection, maxDuration, haptic]);

  const handleReplace = async () => {
    if (!isValid) return;
    
    haptic.impact('medium');

    let finalPrompt = prompt;
    if (editedLyrics && editedLyrics !== selectedSection?.lyrics) {
      finalPrompt = editedLyrics + (prompt ? `\n\n${prompt}` : '');
    }

    const result = await replaceMutation.mutateAsync({
      trackId,
      prompt: finalPrompt || undefined,
      tags: tags || undefined,
      infillStartS: Math.round(startTime * 10) / 10,
      infillEndS: Math.round(endTime * 10) / 10,
    });

    if (result?.taskId) {
      setActiveTask(result.taskId);
      haptic.success();
    }
    
    onOpenChange(false);
    clearSelection();
  };

  const handlePresetClick = (presetPrompt: string) => {
    haptic.tap();
    setPrompt(prompt ? `${prompt}, ${presetPrompt}` : presetPrompt);
  };

  const handleClose = () => {
    clearSelection();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] px-0 rounded-t-3xl">
        {/* Drag Handle */}
        <motion.div 
          className="flex justify-center pt-2 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="w-12 h-1.5 bg-muted-foreground/30 rounded-full"
            animate={{ 
              scaleX: [1, 0.8, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        <SheetHeader className="px-4 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
              </motion.div>
              <div>
                <SheetTitle className="text-base">Заменить секцию</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {trackTitle}
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-180px)]">
          <motion.div 
            className="px-4 py-4 space-y-5"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Quick Section Selection */}
            {sections.length > 0 && (
              <motion.div variants={itemVariants}>
                <Label className="text-xs text-muted-foreground mb-3 block">
                  Выберите секцию
                </Label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  {sections.map((section, idx) => {
                    const isSelected = selectedSectionIndex === idx;
                    const sectionLen = section.endTime - section.startTime;
                    const isTooLong = sectionLen > maxDuration;
                    
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSectionSelect(section, idx)}
                        variants={sectionPillVariants}
                        initial="initial"
                        animate={isSelected ? "selected" : "animate"}
                        whileTap={{ scale: 0.95 }}
                        custom={idx}
                        className={cn(
                          'flex-shrink-0 px-4 py-3 rounded-xl border-2 min-w-[100px] min-h-[60px]',
                          isSelected 
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                            : 'border-border bg-muted/30',
                          isTooLong && 'opacity-70'
                        )}
                      >
                        <span className="font-medium text-sm block">{section.label}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {formatTime(section.startTime)} - {formatTime(section.endTime)}
                        </span>
                        {isTooLong && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 mx-auto" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Waveform Preview */}
            <motion.div variants={itemVariants}>
              <SectionWaveformPreview
                duration={duration}
                startTime={localStart}
                endTime={localEnd}
                isValid={isValid}
                className="mb-2"
                interactive
                onSelectionChange={handleWaveformSelectionChange}
              />
            </motion.div>

            {/* Section Preview Player */}
            {audioUrl && (
              <motion.div variants={itemVariants} className="mb-4">
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" />
                  Предпрослушивание
                </Label>
                <SectionPreviewPlayer
                  audioUrl={audioUrl}
                  startTime={localStart}
                  endTime={localEnd}
                />
              </motion.div>
            )}

            {/* Time Range Slider */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Диапазон времени</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={isValid ? 'secondary' : 'destructive'} className="text-xs font-mono">
                    {formatTime(sectionDuration)} / {formatTime(maxDuration)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <Slider
                  value={[localStart, localEnd]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={handleRangeChange}
                  className="touch-pan-x"
                />
                
                <div className="flex justify-between text-sm font-mono">
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block">Начало</span>
                    <motion.span 
                      key={localStart}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-semibold"
                    >
                      {formatTime(localStart)}
                    </motion.span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block">Конец</span>
                    <motion.span 
                      key={localEnd}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-semibold"
                    >
                      {formatTime(localEnd)}
                    </motion.span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {!isValid && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs overflow-hidden"
                  >
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Секция слишком длинная</p>
                      <p className="text-muted-foreground">
                        Максимум: {formatTime(maxDuration)} (50% трека)
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick Presets */}
            <motion.div variants={itemVariants}>
              <Label className="text-xs text-muted-foreground mb-2 block">Быстрые стили</Label>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((preset, idx) => (
                  <motion.div
                    key={preset.label}
                    variants={presetVariants}
                    custom={idx}
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs rounded-full"
                      onClick={() => handlePresetClick(preset.prompt)}
                    >
                      {preset.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Prompt Input */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="prompt" className="text-xs text-muted-foreground">
                Описание новой секции
              </Label>
              <Textarea
                id="prompt"
                placeholder="Опишите стиль... Например: более энергичный, с электро-гитарой..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] resize-none text-base rounded-xl"
              />
            </motion.div>

            {/* Collapsible Lyrics Editor */}
            <motion.div variants={itemVariants}>
              <Collapsible open={showLyricsEditor} onOpenChange={setShowLyricsEditor}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Изменить текст секции
                    </span>
                    <motion.span animate={{ rotate: showLyricsEditor ? 180 : 0 }}>
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <Textarea
                    placeholder="Новый текст для секции..."
                    value={editedLyrics}
                    onChange={(e) => setEditedLyrics(e.target.value)}
                    className="min-h-[100px] resize-none text-base font-mono rounded-xl"
                  />
                </CollapsibleContent>
              </Collapsible>
            </motion.div>

            {/* Tags */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="tags" className="text-xs text-muted-foreground">Стиль музыки</Label>
              <Input
                id="tags"
                placeholder="rock, guitar, energetic..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-12 text-base rounded-xl"
              />
            </motion.div>
          </motion.div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-border/50 bg-background safe-area-pb">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={replaceMutation.isPending}
              className="flex-1 h-12 rounded-xl"
            >
              Отмена
            </Button>
            <Button
              onClick={handleReplace}
              disabled={!isValid || replaceMutation.isPending}
              className="flex-[2] h-12 rounded-xl gap-2"
            >
              {replaceMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Заменить секцию
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
