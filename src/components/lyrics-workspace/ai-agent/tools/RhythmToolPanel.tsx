/**
 * Rhythm Tool Panel - Uses analyze_rhythm action to analyze syllables and rhythm
 */

import { motion } from '@/lib/motion';
import { Music, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ToolPanelProps } from '../types';

export function RhythmToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);
  
  // Count lines for preview
  const lyrics = context.existingLyrics || context.selectedSection?.content || '';
  const lineCount = lyrics.split('\n').filter(line => line.trim() && !line.trim().startsWith('[')).length;

  const handleAnalyze = () => {
    onExecute({
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
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
      className="border border-orange-500/30 rounded-lg bg-orange-500/5 overflow-hidden"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">Ритм</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Анализ слогов, ударений и ритмического рисунка текста
        </p>

        {!hasContent ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Нет текста для анализа. Сначала напишите текст.
            </p>
          </div>
        ) : (
          <>
            {/* Content info */}
            <div className="p-2 rounded-md bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Строк для анализа:</span>
                <span className="font-medium">{lineCount}</span>
              </div>
            </div>

            {/* What will be analyzed */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Что будет проанализировано:</Label>
              <ul className="text-xs text-muted-foreground space-y-1 pl-3">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                  Количество слогов в каждой строке
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                  Ритмический рисунок (ударные/безударные)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                  Консистентность ритма между секциями
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                  Проблемные места для вокала
                </li>
              </ul>
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Music className="w-4 h-4 mr-2" />
              Анализировать ритм
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
