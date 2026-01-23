/**
 * ArtistNameErrorAlert - User-friendly error display for blocked artist names
 * Shows clear explanation with examples of how to fix
 */

import { memo, useMemo } from 'react';
import { AlertTriangle, Lightbulb, ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { findArtistReplacement, getGenreSuggestions } from '@/lib/artistReplacements';

interface ArtistNameErrorAlertProps {
  /** The error message from provider (contains artist name) */
  errorMessage: string;
  /** The blocked artist name (extracted) */
  blockedArtist?: string;
  /** Callback when user wants to edit prompt */
  onEdit?: () => void;
  /** Callback to apply a suggestion */
  onApplySuggestion?: (suggestion: string) => void;
  /** Callback to dismiss */
  onDismiss?: () => void;
  /** Custom class */
  className?: string;
}

/**
 * Extract artist name from Suno error message
 * Pattern: "Your prompt contains artist name XXX - we don't reference..."
 */
function extractArtistFromError(errorMessage: string): string | null {
  // Pattern: "contains artist name XXX -"
  const match = errorMessage.match(/contains (?:artist name|the name) (\w+)/i);
  if (match) return match[1];
  
  // Pattern: "tags contain artist name XXX"
  const tagsMatch = errorMessage.match(/tags contain (?:artist name|the name) (\w+)/i);
  if (tagsMatch) return tagsMatch[1];
  
  return null;
}

export const ArtistNameErrorAlert = memo(function ArtistNameErrorAlert({
  errorMessage,
  blockedArtist,
  onEdit,
  onApplySuggestion,
  onDismiss,
  className,
}: ArtistNameErrorAlertProps) {
  // Extract artist name from error message if not provided
  const artistName = blockedArtist || extractArtistFromError(errorMessage);
  
  // Find replacement suggestions
  const suggestions = useMemo(() => {
    if (!artistName) return [];
    
    const replacement = findArtistReplacement(artistName);
    if (replacement) {
      return getGenreSuggestions(replacement);
    }
    
    // Default suggestions if no specific replacement found
    return [
      'мелодичный вокал с эмоциональными текстами',
      'современный поп с танцевальными битами',
      'атмосферная музыка с глубоким басом',
    ];
  }, [artistName]);

  // Examples for the user
  const examples = useMemo(() => {
    if (!artistName) return [];
    
    const name = artistName.charAt(0).toUpperCase() + artistName.slice(1).toLowerCase();
    return [
      { before: `как ${name}`, after: suggestions[0] || 'описание стиля' },
      { before: `в стиле ${name}`, after: suggestions[1] || 'жанр и настроение' },
      { before: `голосом ${name}`, after: 'тип вокала (мужской/женский, высокий/низкий)' },
    ];
  }, [artistName, suggestions]);

  return (
    <Card className={cn(
      'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20',
      'shadow-lg',
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Имя артиста не поддерживается
                </h4>
                {artistName && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    «{artistName}» нельзя использовать в промпте
                  </p>
                )}
              </div>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-8 w-8 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Explanation */}
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Suno AI не поддерживает имена конкретных артистов. 
              Опишите желаемый стиль музыки своими словами.
            </p>
            
            {/* Examples section */}
            {examples.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium">Примеры замены:</span>
                </div>
                
                <div className="space-y-1.5">
                  {examples.slice(0, 2).map((example, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 text-[11px] bg-background/50 rounded-md px-2 py-1.5"
                    >
                      <span className="text-muted-foreground line-through">
                        {example.before}
                      </span>
                      <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="text-foreground font-medium truncate">
                        {example.after}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggestions */}
            {suggestions.length > 0 && onApplySuggestion && (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  Нажмите, чтобы использовать:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onApplySuggestion(suggestion)}
                      className={cn(
                        "h-auto py-1.5 px-2.5 text-[11px] gap-1.5",
                        "bg-background/80 border-amber-500/30",
                        "hover:bg-amber-500/20 hover:border-amber-500/50",
                        "transition-all touch-manipulation"
                      )}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="truncate max-w-[160px]">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              {onEdit && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onEdit}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Изменить промпт
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ArtistNameErrorAlert;
