/**
 * Continue Tool Panel - Uses continue_line action to extend lyrics
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X, Sparkles, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

const CONTINUE_STYLES = [
  { id: 'natural', label: 'Естественно', desc: 'Продолжить в том же стиле' },
  { id: 'dramatic', label: 'Драматично', desc: 'Усилить эмоции' },
  { id: 'contrast', label: 'Контраст', desc: 'Сменить настроение' },
  { id: 'climax', label: 'Кульминация', desc: 'Вести к пику' },
];

export function ContinueToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [selectedStyle, setSelectedStyle] = useState('natural');
  const [customContext, setCustomContext] = useState('');

  // Get the last line(s) from existing lyrics
  const lastLines = useMemo(() => {
    const lyrics = context.existingLyrics || context.selectedSection?.content || '';
    const lines = lyrics.split('\n').filter(line => line.trim());
    return lines.slice(-3).join('\n');
  }, [context.existingLyrics, context.selectedSection?.content]);

  const hasContent = !!lastLines;

  const handleContinue = () => {
    onExecute({
      lastLines,
      style: selectedStyle,
      customContext: customContext.trim() || undefined,
      existingLyrics: context.existingLyrics,
      genre: context.genre,
      mood: context.mood,
      title: context.title,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border border-sky-500/30 rounded-lg bg-sky-500/5 overflow-hidden"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-medium">Продолжить</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {!hasContent ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Нет текста для продолжения. Сначала напишите или выберите секцию.
            </p>
          </div>
        ) : (
          <>
            {/* Last lines preview */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Последние строки</Label>
              <div className="p-2 rounded-md bg-muted/30 border border-border/50">
                <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {lastLines || '...'}
                </p>
              </div>
            </div>

            {/* Style selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Стиль продолжения</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {CONTINUE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all",
                      selectedStyle === style.id
                        ? "border-sky-500/50 bg-sky-500/10"
                        : "border-border/50 hover:bg-muted/50"
                    )}
                    disabled={isLoading}
                  >
                    <p className="text-xs font-medium">{style.label}</p>
                    <p className="text-[10px] text-muted-foreground">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional context */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Подсказка (опционально)</Label>
              <Textarea
                placeholder="О чём должно быть продолжение..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Продолжить текст
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
