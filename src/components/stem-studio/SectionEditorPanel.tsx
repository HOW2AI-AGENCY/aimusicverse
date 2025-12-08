import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wand2, Loader2, FileText, ChevronDown, 
  Music, AlertTriangle, Sparkles, RotateCcw
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
import { cn } from '@/lib/utils';

interface SectionEditorPanelProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  duration: number;
  onClose: () => void;
}

const PROMPT_PRESETS = [
  { label: '⚡ Энергичнее', prompt: 'more energetic, higher tempo, powerful' },
  { label: '🎵 Мягче', prompt: 'softer, gentler, acoustic feel' },
  { label: '🎬 Эпичнее', prompt: 'epic, orchestral, cinematic' },
  { label: '🎹 Минимал', prompt: 'minimal, stripped down, simple' },
];

export function SectionEditorPanel({
  trackId,
  trackTitle,
  trackTags,
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
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Редактирование секции
                  {selectedSection && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedSection.label}
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatTime(startTime)} - {formatTime(endTime)} ({formatTime(sectionDuration)})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Validation Warning */}
          {!isValid && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Секция слишком длинная</p>
                <p className="text-muted-foreground">
                  Максимум: {formatTime(maxDuration)} (50% трека)
                </p>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePresetClick(preset.prompt)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-xs">
              Описание новой секции
            </Label>
            <Textarea
              id="prompt"
              placeholder="Опишите стиль... Например: более энергичный, с электро-гитарой..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          {/* Collapsible Lyrics Editor */}
          <Collapsible open={showLyricsEditor} onOpenChange={setShowLyricsEditor}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                <span className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Изменить текст секции
                </span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showLyricsEditor && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder="Новый текст для секции..."
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="min-h-[80px] resize-none text-sm font-mono"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs">Стиль музыки</Label>
            <Input
              id="tags"
              placeholder="rock, guitar, energetic..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
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
            <Button
              onClick={handleReplace}
              disabled={!isValid || replaceMutation.isPending}
              className="flex-1 h-9 gap-2"
            >
              {replaceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Заменить секцию
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
