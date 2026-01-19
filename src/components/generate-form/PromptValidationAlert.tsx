/**
 * PromptValidationAlert - Real-time prompt validation with artist detection
 * Shows warning when blocked artist names are detected with replacement suggestions
 */

import { memo, useMemo, useCallback } from 'react';
import { AlertTriangle, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';
import { findArtistReplacement, getGenreSuggestions, type ArtistReplacement } from '@/lib/artistReplacements';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface PromptValidationAlertProps {
  text: string;
  onApplyReplacement?: (newText: string) => void;
  className?: string;
}

export const PromptValidationAlert = memo(function PromptValidationAlert({
  text,
  onApplyReplacement,
  className,
}: PromptValidationAlertProps) {
  const { hapticFeedback } = useTelegram();
  
  const artistMatch = useMemo(() => findArtistReplacement(text), [text]);
  
  const suggestions = useMemo(() => {
    if (!artistMatch) return [];
    return getGenreSuggestions(artistMatch);
  }, [artistMatch]);
  
  const handleApplySuggestion = useCallback((suggestion: string) => {
    if (!artistMatch || !onApplyReplacement) return;
    
    hapticFeedback('light');
    
    // Replace the artist mention with the suggestion
    let newText = text;
    
    // Common phrase patterns to replace
    const patterns = [
      new RegExp(`(как|в стиле|похоже на|типа|вроде)\\s*${artistMatch.pattern.source}`, 'gi'),
      new RegExp(`(like|similar to|style of)\\s*${artistMatch.pattern.source}`, 'gi'),
      artistMatch.pattern,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(newText)) {
        newText = newText.replace(pattern, suggestion);
        break;
      }
    }
    
    onApplyReplacement(newText);
  }, [artistMatch, text, onApplyReplacement, hapticFeedback]);
  
  if (!artistMatch) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        className={cn(
          "rounded-xl border border-amber-500/30 bg-amber-500/10 overflow-hidden",
          className
        )}
      >
        <div className="p-3 space-y-2">
          {/* Warning header */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Имя «{artistMatch.artist}» заблокировано
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Suno AI не поддерживает имена артистов. Выберите стиль:
              </p>
            </div>
          </div>
          
          {/* Replacement suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplySuggestion(suggestion)}
                className={cn(
                  "h-auto py-1.5 px-2.5 text-[11px] gap-1.5",
                  "bg-background/80 border-amber-500/30",
                  "hover:bg-amber-500/20 hover:border-amber-500/50",
                  "transition-all"
                )}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="truncate max-w-[180px]">{suggestion}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
