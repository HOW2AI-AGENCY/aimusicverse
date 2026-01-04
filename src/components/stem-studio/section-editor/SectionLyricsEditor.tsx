/**
 * Lyrics editor with AI enhancement and auto-regeneration
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  FileText, Wand2, RotateCcw, Sparkles, Check, 
  Mic, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface SectionLyricsEditorProps {
  lyrics: string;
  onLyricsChange: (value: string) => void;
  originalLyrics?: string;
  sectionLabel?: string;
  onAutoRegenerate?: () => void;
  isRegenerating?: boolean;
  compact?: boolean;
}

type EditMode = 'manual' | 'ai-rewrite' | 'ai-improve' | 'ai-translate';

const AI_MODES = [
  { id: 'ai-rewrite' as EditMode, label: 'Переписать', icon: RefreshCw, description: 'Полностью новый текст' },
  { id: 'ai-improve' as EditMode, label: 'Улучшить', icon: Sparkles, description: 'Сохранить смысл, улучшить рифмы' },
  { id: 'ai-translate' as EditMode, label: 'Перевод EN', icon: FileText, description: 'Перевести на английский' },
];

export function SectionLyricsEditor({
  lyrics,
  onLyricsChange,
  originalLyrics,
  sectionLabel,
  onAutoRegenerate,
  isRegenerating = false,
  compact = false,
}: SectionLyricsEditorProps) {
  const [isExpanded, setIsExpanded] = useState(!!lyrics);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingLyrics, setPendingLyrics] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const haptic = useHapticFeedback();

  const lyricsChanged = lyrics && originalLyrics && lyrics.trim() !== originalLyrics.trim();
  const hasContent = lyrics.trim().length > 0;

  // Auto-expand when there's content
  useEffect(() => {
    if (originalLyrics && !lyrics) {
      onLyricsChange(originalLyrics);
    }
  }, [originalLyrics]);

  const handleAIEdit = useCallback(async (mode: EditMode) => {
    if (!lyrics.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    haptic.tap();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-lyrics-edit', {
        body: {
          lyrics: lyrics,
          mode: mode.replace('ai-', ''),
          context: sectionLabel,
        },
      });

      if (fnError) throw fnError;

      if (data?.lyrics) {
        setPendingLyrics(data.lyrics);
        haptic.success();
      }
    } catch (err) {
      setError('Не удалось обработать текст');
      haptic.error();
    } finally {
      setIsProcessing(false);
    }
  }, [lyrics, sectionLabel, haptic]);

  const acceptPendingLyrics = useCallback(() => {
    if (pendingLyrics) {
      onLyricsChange(pendingLyrics);
      setPendingLyrics(null);
      haptic.success();
    }
  }, [pendingLyrics, onLyricsChange, haptic]);

  const rejectPendingLyrics = useCallback(() => {
    setPendingLyrics(null);
    haptic.tap();
  }, [haptic]);

  const resetToOriginal = useCallback(() => {
    if (originalLyrics) {
      onLyricsChange(originalLyrics);
      haptic.tap();
    }
  }, [originalLyrics, onLyricsChange, haptic]);

  const handleAutoRegenerate = useCallback(() => {
    if (lyricsChanged && onAutoRegenerate) {
      onAutoRegenerate();
    }
  }, [lyricsChanged, onAutoRegenerate]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Текст секции
            {sectionLabel && (
              <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                {sectionLabel}
              </Badge>
            )}
          </Label>

          <div className="flex items-center gap-1">
            {lyricsChanged && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1"
              >
                <Badge 
                  variant="secondary" 
                  className="h-5 text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400"
                >
                  Изменён
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={resetToOriginal}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Вернуть оригинал</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </div>
        </div>

        {/* Lyrics textarea */}
        <div className="relative">
          <Textarea
            placeholder="Введите или измените текст секции..."
            value={lyrics}
            onChange={(e) => onLyricsChange(e.target.value)}
            className={cn(
              "resize-none text-sm font-mono transition-all",
              "focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]",
              compact ? "min-h-[80px]" : "min-h-[100px]",
              lyricsChanged && "border-amber-500/50",
              pendingLyrics && "opacity-50"
            )}
            disabled={isProcessing || !!pendingLyrics}
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
            {lyrics.length} символов
          </div>
        </div>

        {/* AI Edit buttons */}
        <div className="flex flex-wrap gap-1.5">
          {AI_MODES.map((mode) => (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs gap-1.5 transition-all",
                    "hover:bg-primary/10 hover:border-primary/50"
                  )}
                  onClick={() => handleAIEdit(mode.id)}
                  disabled={!hasContent || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <mode.icon className="w-3 h-3" />
                  )}
                  {mode.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{mode.description}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending AI result preview */}
        <AnimatePresence>
          {pendingLyrics && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="space-y-2"
            >
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">AI предложение</span>
                </div>
                <p className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                  {pendingLyrics}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 gap-1.5 flex-1"
                  onClick={acceptPendingLyrics}
                >
                  <Check className="w-3.5 h-3.5" />
                  Принять
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={rejectPendingLyrics}
                >
                  Отклонить
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-regenerate button */}
        <AnimatePresence>
          {lyricsChanged && onAutoRegenerate && !pendingLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "w-full h-9 gap-2",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "shadow-lg shadow-primary/20"
                )}
                onClick={handleAutoRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                    Перегенерировать с новым текстом
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
