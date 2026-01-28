/**
 * Smart Assistant Inline Component
 * Compact inline suggestions for form integration
 */

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Sparkles, 
  ChevronRight,
  X,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SmartSuggestionCard } from './SmartSuggestionCard';
import { useSmartAssistant } from '@/hooks/generation/useSmartAssistant';
import type { SmartSuggestion } from './types';

interface SmartAssistantInlineProps {
  onApplySuggestion: (prompt: string, metadata?: SmartSuggestion['metadata']) => void;
  maxVisible?: number;
  className?: string;
}

export const SmartAssistantInline = memo(function SmartAssistantInline({
  onApplySuggestion,
  maxVisible = 3,
  className,
}: SmartAssistantInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    suggestions,
    isAnalyzing,
    dismissSuggestion,
    hasContext,
  } = useSmartAssistant({ autoAnalyze: true, maxSuggestions: 5 });

  const handleApply = useCallback((suggestion: SmartSuggestion) => {
    onApplySuggestion(suggestion.prompt, suggestion.metadata);
  }, [onApplySuggestion]);

  const visibleSuggestions = expanded 
    ? suggestions 
    : suggestions.slice(0, maxVisible);

  const hasMore = suggestions.length > maxVisible;

  if (suggestions.length === 0 && !isAnalyzing) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span>Smart подсказки</span>
          {hasContext && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1">
              персонализировано
            </Badge>
          )}
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
          >
            {expanded ? 'Свернуть' : `Ещё ${suggestions.length - maxVisible}`}
            <ChevronRight className={cn(
              "h-3 w-3 transition-transform",
              expanded && "rotate-90"
            )} />
          </Button>
        )}
      </div>

      {/* Compact chips */}
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion, index) => (
            <SmartSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={handleApply}
              onDismiss={dismissSuggestion}
              compact
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Loading state */}
      {isAnalyzing && suggestions.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>Анализируем ваш стиль...</span>
        </div>
      )}
    </div>
  );
});
