/**
 * Contextual Hint Component
 * 
 * Всплывающая подсказка с анимацией и действиями
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { X, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { ContextualHint as ContextualHintType } from '@/hooks/useContextualHints';

interface ContextualHintProps {
  hint: ContextualHintType;
  onDismiss: (forever?: boolean) => void;
  position?: 'top' | 'bottom' | 'center';
}

const categoryColors = {
  model: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20',
  'ai-feature': 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/20',
  project: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
  artist: 'border-pink-500/50 bg-pink-50 dark:bg-pink-950/20',
  social: 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/20',
  advanced: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
  tip: 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/20',
};

const categoryIcons = {
  model: '🚀',
  'ai-feature': '✨',
  project: '📁',
  artist: '👤',
  social: '💬',
  advanced: '⚙️',
  tip: '💡',
};

export function ContextualHint({ hint, onDismiss, position = 'bottom' }: ContextualHintProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (hint.action?.route) {
      navigate(hint.action.route);
    }
    onDismiss(false);
  };

  const positionClasses = {
    top: 'top-20',
    // Adjusted for mobile: account for island-nav (~4rem height) + safe-area-inset + spacing
    bottom: 'bottom-[6.5rem] md:bottom-24',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md md:w-[calc(100%-2rem)]',
          positionClasses[position]
        )}
      >
        <Card
          className={cn(
            'border-2 shadow-xl backdrop-blur-sm',
            categoryColors[hint.category]
          )}
        >
          <div className="p-3 md:p-4">
            {/* Header */}
            <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
              <div 
                className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-background/50 flex items-center justify-center text-xl md:text-2xl"
                aria-hidden="true"
              >
                {hint.icon || categoryIcons[hint.category]}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-foreground leading-tight mb-1">
                  {hint.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {hint.description}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(false)}
                className="flex-shrink-0 h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-background/50"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="sr-only">Закрыть</span>
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/50">
              <button
                onClick={() => onDismiss(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Не показывать
              </button>

              {hint.action && (
                <Button
                  size="sm"
                  onClick={handleAction}
                  className="h-7 md:h-8 text-xs gap-1 bg-primary hover:bg-primary/90 px-3"
                >
                  {hint.action.label}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact inline hint variant
 */
interface InlineHintProps {
  hint: ContextualHintType;
  onDismiss: () => void;
}

export function InlineHint({ hint, onDismiss }: InlineHintProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          'flex items-start gap-2 p-3 rounded-lg border-l-4 mb-3',
          categoryColors[hint.category]
        )}
      >
        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground mb-1">{hint.title}</p>
          <p className="text-xs text-muted-foreground">{hint.description}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-background/50 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
