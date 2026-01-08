/**
 * QuickInputBar - Quick prompt input for fast generation
 * Mobile-optimized with larger touch targets and scroll indicators
 */

import { memo, useState, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HorizontalScrollFade } from '@/components/ui/horizontal-scroll-fade';
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
    <section className={cn('space-y-3', className)}>
      {/* Section label - helps establish hierarchy */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Быстрое создание</span>
      </div>
      
      {/* Input container - larger touch target */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Sparkles className="w-4 h-4 text-muted-foreground/50" />
        </div>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опиши музыку, например: грустный лоу-фай..."
          aria-label="Описание музыки для генерации"
          className={cn(
            // Large touch-friendly input - 56px on mobile
            'pl-11 pr-16 h-14 text-base',
            'bg-card/80 backdrop-blur-sm rounded-xl',
            'border-border/50 focus:border-primary/50',
            'placeholder:text-muted-foreground/50'
          )}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!prompt.trim() && !SUGGESTIONS[activeSuggestion]}
          aria-label="Создать музыку"
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            // Touch-friendly button - 48px
            'w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl',
            'bg-generate hover:bg-generate/90 shadow-md shadow-generate/20'
          )}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Suggestions with scroll fade */}
      <HorizontalScrollFade fadeWidth={24}>
        <div className="flex items-center gap-2 pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/60" aria-hidden="true" />
            <span className="text-xs text-muted-foreground/60">Попробуй:</span>
          </div>
          {SUGGESTIONS.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSuggestionClick(suggestion)}
              aria-label={`Создать: ${suggestion}`}
              className={cn(
                // Touch-friendly chip - 36px minimum height
                'shrink-0 px-3 py-2 min-h-[36px] rounded-full text-xs',
                'bg-muted/50 hover:bg-primary/10 hover:text-primary',
                'border border-transparent hover:border-primary/20',
                'transition-all duration-150 active:scale-95'
              )}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </HorizontalScrollFade>
    </section>
  );
});
