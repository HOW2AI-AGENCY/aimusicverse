/**
 * RhymeToolPanel - Panel for rhyme suggestions
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Mic2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

// Common rhyme endings for quick access
const COMMON_ENDINGS = [
  'любовь', 'ночь', 'день', 'мечта', 
  'душа', 'сердце', 'глаза', 'свет',
  'путь', 'жизнь', 'время', 'небо'
];

export function RhymeToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [word, setWord] = useState('');
  const [recentWords, setRecentWords] = useState<string[]>([]);

  const handleSearch = (searchWord?: string) => {
    const targetWord = searchWord || word;
    if (!targetWord.trim()) return;
    
    // Add to recent if not already there
    if (!recentWords.includes(targetWord)) {
      setRecentWords(prev => [targetWord, ...prev].slice(0, 5));
    }
    
    onExecute({ word: targetWord });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Extract last word from selected section if available
  const suggestedWord = context.selectedSection?.content
    ?.split(/\s+/)
    .filter(w => w.length > 2)
    .pop() || '';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border/50 bg-cyan-500/5 max-h-[50vh] overflow-y-auto overscroll-contain"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Mic2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Поиск рифм</h3>
              <p className="text-[10px] text-muted-foreground">Найти рифмы к слову</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Word Input */}
        <div className="space-y-1.5">
          <Label className="text-xs">Слово для рифмы</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Введите слово..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={() => handleSearch()}
              disabled={isLoading || !word.trim()}
              className="px-3"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Suggested from selection */}
        {suggestedWord && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Из выделения:</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setWord(suggestedWord);
                handleSearch(suggestedWord);
              }}
            >
              "{suggestedWord}"
            </Button>
          </div>
        )}

        {/* Recent Words */}
        {recentWords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Недавние:</p>
            <div className="flex flex-wrap gap-1.5">
              {recentWords.map((w) => (
                <Button
                  key={w}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setWord(w);
                    handleSearch(w);
                  }}
                >
                  {w}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Words */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">Популярные:</p>
          <div className="flex flex-wrap gap-1">
            {COMMON_ENDINGS.map((w) => (
              <button
                key={w}
                className={cn(
                  "px-2 py-1 text-[10px] rounded-md border border-border/50",
                  "hover:bg-muted/50 transition-colors"
                )}
                onClick={() => {
                  setWord(w);
                  handleSearch(w);
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
