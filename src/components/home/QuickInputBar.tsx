/**
 * QuickInputBar - Quick prompt input for fast generation
 */

import { memo, useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickInputBarProps {
  onSubmit: (prompt: string) => void;
  className?: string;
}

const SUGGESTIONS = [
  'Лёгкий джаз для кофейни',
  'Энергичный рок для тренировки',
  'Грустный лоу-фай вечером',
  'Весёлая поп музыка',
];

export const QuickInputBar = memo(function QuickInputBar({
  onSubmit,
  className,
}: QuickInputBarProps) {
  const [prompt, setPrompt] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const handleSubmit = useCallback(() => {
    const text = prompt.trim() || SUGGESTIONS[activeSuggestion];
    if (text) {
      onSubmit(text);
      setPrompt('');
    }
  }, [prompt, activeSuggestion, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onSubmit(suggestion);
  }, [onSubmit]);

  return (
    <section className={cn('space-y-2', className)}>
      {/* Input container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опиши музыку, которую хочешь создать..."
          className={cn(
            'pl-10 pr-12 h-12 text-sm',
            'bg-background/80 backdrop-blur-sm',
            'border-primary/20 focus:border-primary/40',
            'placeholder:text-muted-foreground/60'
          )}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!prompt.trim() && !SUGGESTIONS[activeSuggestion]}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2',
            'w-9 h-9 rounded-lg',
            'bg-generate hover:bg-generate/90'
          )}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
        <span className="text-xs text-muted-foreground/60 flex-shrink-0">Попробуй:</span>
        {SUGGESTIONS.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSuggestionClick(suggestion)}
            className={cn(
              'flex-shrink-0 px-2.5 py-1 rounded-full text-xs',
              'bg-muted/50 hover:bg-primary/10 hover:text-primary',
              'border border-transparent hover:border-primary/20',
              'transition-all duration-150'
            )}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </section>
  );
});
