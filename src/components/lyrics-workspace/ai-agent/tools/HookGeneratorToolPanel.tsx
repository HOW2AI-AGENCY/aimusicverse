/**
 * Hook Generator Tool Panel
 * Analyze and generate catchy hooks
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Music } from 'lucide-react';
import { ToolPanelProps } from '../types';

export const HookGeneratorToolPanel: React.FC<ToolPanelProps> = ({
  context,
  onExecute,
  onClose,
  isLoading,
}) => {
  const hasLyrics = !!context.existingLyrics?.trim();

  const handleExecute = () => {
    onExecute({
      lyrics: context.existingLyrics,
      genre: context.genre,
      mood: context.mood,
      theme: context.title,
    });
  };

  if (!hasLyrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Сначала напишите текст для анализа хуков</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="w-4 h-4" />
        <span>Найдёт и улучшит запоминающиеся строки</span>
      </div>

      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <Music className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Что сделает AI:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Найдёт существующие хуки в тексте</li>
              <li>• Оценит их "цепляемость" (1-10)</li>
              <li>• Предложит 5 новых вариантов хуков</li>
              <li>• Подскажет где их лучше разместить</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-muted/50">
          <div className="font-medium">Жанр</div>
          <div className="text-muted-foreground">{context.genre || 'поп'}</div>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <div className="font-medium">Настроение</div>
          <div className="text-muted-foreground">{context.mood || 'не указано'}</div>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <div className="font-medium">Строк</div>
          <div className="text-muted-foreground">
            {context.existingLyrics?.split('\n').filter(l => l.trim()).length || 0}
          </div>
        </div>
      </div>

      <Button
        onClick={handleExecute}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
      >
        <Zap className="w-4 h-4 mr-2" />
        {isLoading ? 'Анализирую хуки...' : 'Найти и улучшить хуки'}
      </Button>
    </div>
  );
};
