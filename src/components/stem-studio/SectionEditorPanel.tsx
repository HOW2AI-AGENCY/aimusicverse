import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  X, Wand2, Loader2, FileText, ChevronDown, 
  Music, AlertTriangle, Sparkles, RotateCcw, Zap, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { SectionWaveformPreview } from './SectionWaveformPreview';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2 },
      staggerChildren: 0.05,
      delayChildren: 0.1 
    }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { 
      height: { duration: 0.2 },
      opacity: { duration: 0.15 }
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

const presetVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  },
  tap: { scale: 0.95 }
};

interface SectionEditorPanelProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  onClose: () => void;
}

const PROMPT_PRESETS = [
  { label: '⚡ Энергичнее', prompt: 'more energetic, higher tempo, powerful', icon: Zap },
  { label: '🎵 Мягче', prompt: 'softer, gentler, acoustic feel' },
  { label: '🎬 Эпичнее', prompt: 'epic, orchestral, cinematic' },
  { label: '🎹 Минимал', prompt: 'minimal, stripped down, simple' },
  { label: '🎸 Рок', prompt: 'rock style, distorted guitar, drums' },
  { label: '🎤 Акустика', prompt: 'acoustic, unplugged, natural' },
];

export function SectionEditorPanel({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  onClose,
}: SectionEditorPanelProps) {
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  
  const {
    selectedSection,
    customRange,
    editedLyrics,
    prompt,
    tags,
    setEditedLyrics,
    setPrompt,
    setTags,
    setActiveTask,
    clearSelection,
  } = useSectionEditorStore();

  const replaceMutation = useReplaceSectionMutation();

  // Initialize tags from track
  useEffect(() => {
    if (trackTags && !tags) {
      setTags(trackTags);
    }
  }, [trackTags, tags, setTags]);

  const startTime = customRange?.start ?? selectedSection?.startTime ?? 0;
  const endTime = customRange?.end ?? selectedSection?.endTime ?? 0;
  const sectionDuration = endTime - startTime;
  const maxDuration = duration * 0.5;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReplace = async () => {
    if (!isValid) return;

    // Build prompt with lyrics if provided
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

    // Track the task
    if (result?.taskId) {
      setActiveTask(result.taskId);
    }
    
    onClose();
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(prompt ? `${prompt}, ${presetPrompt}` : presetPrompt);
  };

  const handleClose = () => {
    clearSelection();
    onClose();
  };

  if (!customRange && !selectedSection) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="section-editor"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
                animate={{ 
                  boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.3)', '0 0 0 8px hsl(var(--primary) / 0)', '0 0 0 0 hsl(var(--primary) / 0)'] 
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Редактирование секции
                  {selectedSection && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Badge variant="secondary" className="text-xs">
                        {selectedSection.label}
                      </Badge>
                    </motion.span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatTime(startTime)} - {formatTime(endTime)} ({formatTime(sectionDuration)})
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Waveform Preview */}
          <motion.div variants={itemVariants}>
            <SectionWaveformPreview
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              isValid={isValid}
            />
          </motion.div>

          {/* Section Preview Player */}
          {audioUrl && (
            <motion.div variants={itemVariants}>
              <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Headphones className="w-3 h-3" />
                Предпрослушивание секции
              </Label>
              <SectionPreviewPlayer
                audioUrl={audioUrl}
                startTime={startTime}
                endTime={endTime}
              />
            </motion.div>
          )}

          {/* Validation Warning */}
          <AnimatePresence>
            {!isValid && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs overflow-hidden"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                </motion.div>
                <div>
                  <p className="font-medium text-destructive">Секция слишком длинная</p>
                  <p className="text-muted-foreground">
                    Максимум: {formatTime(maxDuration)} (50% трека)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Presets */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset, idx) => (
              <motion.div
                key={preset.label}
                variants={presetVariants}
                whileTap="tap"
                custom={idx}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs transition-colors hover:bg-primary/10 hover:border-primary/50"
                  onClick={() => handlePresetClick(preset.prompt)}
                >
                  {preset.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Prompt Input */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="prompt" className="text-xs">
              Описание новой секции
            </Label>
            <Textarea
              id="prompt"
              placeholder="Опишите стиль... Например: более энергичный, с электро-гитарой..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[60px] resize-none text-sm transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
            />
          </motion.div>

          {/* Collapsible Lyrics Editor */}
          <motion.div variants={itemVariants}>
            <Collapsible open={showLyricsEditor} onOpenChange={setShowLyricsEditor}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs group">
                  <span className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Изменить текст секции
                  </span>
                  <motion.span
                    animate={{ rotate: showLyricsEditor ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Textarea
                    placeholder="Новый текст для секции..."
                    value={editedLyrics}
                    onChange={(e) => setEditedLyrics(e.target.value)}
                    className="min-h-[80px] resize-none text-sm font-mono"
                  />
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Tags */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs">Стиль музыки</Label>
            <Input
              id="tags"
              placeholder="rock, guitar, energetic..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-8 text-sm"
            />
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={replaceMutation.isPending}
                className="h-9"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Отмена
              </Button>
            </motion.div>
            <motion.div 
              className="flex-1"
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleReplace}
                disabled={!isValid || replaceMutation.isPending}
                className="w-full h-9 gap-2"
              >
                {replaceMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                    Генерация...
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Wand2 className="w-4 h-4" />
                    </motion.div>
                    Заменить секцию
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
