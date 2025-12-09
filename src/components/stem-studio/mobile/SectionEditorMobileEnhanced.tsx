/**
 * Enhanced Section Editor for Mobile
 * Improved lyrics editing with auto-save and better UX
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Save,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface SectionEditorMobileEnhancedProps {
  section: DetectedSection;
  trackId: string;
  trackTags?: string | null;
  isSubmitting: boolean;
  onReplace: (data: { prompt?: string; tags?: string; lyrics?: string }) => Promise<void>;
  onCancel: () => void;
}

interface EditState {
  lyrics: string;
  prompt: string;
  tags: string;
  isDirty: boolean;
  lastSaved: number | null;
}

const AUTOSAVE_DELAY = 2000; // 2 seconds

export const SectionEditorMobileEnhanced = ({
  section,
  trackId,
  trackTags,
  isSubmitting,
  onReplace,
  onCancel,
}: SectionEditorMobileEnhancedProps) => {
  const [editState, setEditState] = useState<EditState>({
    lyrics: section.lyrics || '',
    prompt: '',
    tags: trackTags || '',
    isDirty: false,
    lastSaved: null,
  });

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const savedKey = `section-edit-${trackId}-${section.startTime}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEditState(prev => ({
          ...prev,
          ...parsed,
          isDirty: true,
        }));
        toast.info('Восстановлен сохранённый черновик', {
          duration: 2000,
        });
      } catch (error) {
        logger.error('Failed to parse saved edit state', error);
      }
    }
  }, [trackId, section.startTime]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!editState.isDirty) return;

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      const savedKey = `section-edit-${trackId}-${section.startTime}`;
      localStorage.setItem(savedKey, JSON.stringify({
        lyrics: editState.lyrics,
        prompt: editState.prompt,
        tags: editState.tags,
      }));
      setEditState(prev => ({ ...prev, lastSaved: Date.now() }));
      setIsSaving(false);
    }, AUTOSAVE_DELAY);

    setAutoSaveTimer(timer);
    setIsSaving(true);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [editState.lyrics, editState.prompt, editState.tags, editState.isDirty, trackId, section.startTime]);

  // Update character count
  useEffect(() => {
    // Count characters excluding section tags like [Verse], [Chorus]
    const cleanText = editState.lyrics.replace(/\[.*?\]/g, '').trim();
    setCharCount(cleanText.length);
  }, [editState.lyrics]);

  // Validate lyrics length
  useEffect(() => {
    if (charCount > 3000) {
      setValidationError('Текст слишком длинный. Максимум 3000 символов.');
    } else if (charCount === 0 && editState.lyrics.trim()) {
      setValidationError('Текст не может состоять только из тегов.');
    } else {
      setValidationError(null);
    }
  }, [charCount, editState.lyrics]);

  const handleLyricsChange = useCallback((value: string) => {
    setEditState(prev => ({
      ...prev,
      lyrics: value,
      isDirty: true,
    }));
  }, []);

  const handlePromptChange = useCallback((value: string) => {
    setEditState(prev => ({
      ...prev,
      prompt: value,
      isDirty: true,
    }));
  }, []);

  const handleTagsChange = useCallback((value: string) => {
    setEditState(prev => ({
      ...prev,
      tags: value,
      isDirty: true,
    }));
  }, []);

  const handleSubmit = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await onReplace({
        lyrics: editState.lyrics !== section.lyrics ? editState.lyrics : undefined,
        prompt: editState.prompt || undefined,
        tags: editState.tags || undefined,
      });

      // Clear saved draft on success
      const savedKey = `section-edit-${trackId}-${section.startTime}`;
      localStorage.removeItem(savedKey);
    } catch (error) {
      logger.error('Error submitting section replacement', error);
    }
  };

  const handleCancel = () => {
    if (editState.isDirty) {
      const confirm = window.confirm(
        'У вас есть несохранённые изменения. Вы уверены, что хотите выйти?'
      );
      if (!confirm) return;
    }
    
    // Clear saved draft
    const savedKey = `section-edit-${trackId}-${section.startTime}`;
    localStorage.removeItem(savedKey);
    
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasChanges = editState.lyrics !== section.lyrics || 
                     editState.prompt.trim() !== '' || 
                     editState.tags !== trackTags;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              {section.label}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatTime(section.startTime)} - {formatTime(section.endTime)}
            </p>
          </div>
        </div>
        
        {/* Auto-save indicator */}
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Сохранение...
            </motion.div>
          ) : editState.lastSaved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs text-green-500"
            >
              <CheckCircle2 className="w-3 h-3" />
              Сохранено
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Lyrics Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lyrics" className="text-sm font-medium">
              Текст секции
            </Label>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs tabular-nums",
                charCount > 3000 ? "text-destructive" : "text-muted-foreground"
              )}>
                {charCount} / 3000
              </span>
            </div>
          </div>
          
          <Textarea
            id="lyrics"
            value={editState.lyrics}
            onChange={(e) => handleLyricsChange(e.target.value)}
            placeholder="Введите или отредактируйте текст..."
            className={cn(
              "min-h-[200px] resize-none font-mono text-sm",
              validationError && "border-destructive focus-visible:ring-destructive"
            )}
            disabled={isSubmitting}
          />
          
          {validationError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <AlertCircle className="w-3 h-3" />
              {validationError}
            </motion.div>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Дополнительные инструкции (опционально)
          </Label>
          <Textarea
            id="prompt"
            value={editState.prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Например: более энергично, добавить гитару..."
            className="min-h-[80px] resize-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium">
            Теги стиля (опционально)
          </Label>
          <Textarea
            id="tags"
            value={editState.tags}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="Rock, Epic, Energetic..."
            className="min-h-[60px] resize-none text-sm"
            disabled={isSubmitting}
          />
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Совет:</strong> Изменённый текст будет использован
            при генерации новой версии секции. Все изменения автоматически сохраняются.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 bg-card/50 space-y-3">
        {isSubmitting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Замена секции...</span>
              <span>1-2 минуты</span>
            </div>
            <Progress value={33} className="h-1" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!validationError || !hasChanges}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
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
  );
};
