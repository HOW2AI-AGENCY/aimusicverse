/**
 * QuickActionsBar - Contextual quick action suggestions
 */

import { motion } from '@/lib/motion';
import { Sparkles, PenLine, RefreshCw, Tag, Music2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface QuickActionsBarProps {
  hasLyrics: boolean;
  genre?: string;
  mood?: string;
  onAction: (action: string) => void;
  className?: string;
}

const NEW_LYRICS_ACTIONS = [
  { 
    label: 'Написать с нуля', 
    action: 'Напиши текст песни с нуля. Предложи несколько тем на выбор.',
    icon: PenLine,
    color: 'text-blue-400'
  },
  { 
    label: 'Предложи идеи', 
    action: 'Предложи 5 интересных тем и концепций для песни',
    icon: Lightbulb,
    color: 'text-amber-400'
  },
  { 
    label: 'По жанру', 
    action: 'Напиши текст песни, подходящий для популярного жанра. Какой жанр предпочитаешь?',
    icon: Music2,
    color: 'text-purple-400'
  },
];

const EDIT_LYRICS_ACTIONS = [
  { 
    label: 'Улучшить', 
    action: 'Улучши существующий текст, сохранив основную идею. Сделай его более выразительным.',
    icon: Sparkles,
    color: 'text-primary'
  },
  { 
    label: 'Добавить теги', 
    action: 'Добавь мета-теги Suno к тексту для лучшей генерации музыки.',
    icon: Tag,
    color: 'text-emerald-400'
  },
  { 
    label: 'Переписать', 
    action: 'Полностью переработай текст, сохранив тему и настроение.',
    icon: RefreshCw,
    color: 'text-orange-400'
  },
];

export function QuickActionsBar({
  hasLyrics,
  genre,
  mood,
  onAction,
  className,
}: QuickActionsBarProps) {
  const actions = hasLyrics ? EDIT_LYRICS_ACTIONS : NEW_LYRICS_ACTIONS;
  
  // Add context to actions if available
  const getContextualAction = (baseAction: string) => {
    let contextParts: string[] = [];
    if (genre) contextParts.push(`жанр: ${genre}`);
    if (mood) contextParts.push(`настроение: ${mood}`);
    
    if (contextParts.length > 0) {
      return `${baseAction} Контекст: ${contextParts.join(', ')}.`;
    }
    return baseAction;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-2", className)}
    >
      <p className="text-xs text-muted-foreground font-medium px-1">
        {hasLyrics ? 'Что сделать с текстом?' : 'С чего начнём?'}
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 text-xs bg-background/50 hover:bg-background"
                onClick={() => {
                  hapticImpact('light');
                  onAction(getContextualAction(action.action));
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", action.color)} />
                {action.label}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
