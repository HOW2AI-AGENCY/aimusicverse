/**
 * Smart Assistant Panel Component
 * Full panel view with all suggestions and context info
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Sparkles, 
  RefreshCw, 
  Brain,
  History,
  Folder,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { SmartSuggestionCard } from './SmartSuggestionCard';
import { useSmartAssistant } from '@/hooks/generation/useSmartAssistant';
import type { SmartSuggestion, ProjectGenerationContext } from './types';

interface SmartAssistantPanelProps {
  onApplySuggestion: (prompt: string, metadata?: SmartSuggestion['metadata']) => void;
  projectContext?: ProjectGenerationContext;
  className?: string;
  defaultOpen?: boolean;
}

export const SmartAssistantPanel = memo(function SmartAssistantPanel({
  onApplySuggestion,
  projectContext,
  className,
  defaultOpen = true,
}: SmartAssistantPanelProps) {
  const {
    suggestions,
    userContext,
    isAnalyzing,
    lastAnalyzedAt,
    error,
    analyze,
    dismissSuggestion,
    setProjectContext,
    hasContext,
  } = useSmartAssistant({ autoAnalyze: true });

  // Set project context when provided
  if (projectContext && projectContext.projectId !== userContext?.recentPrompts[0]) {
    setProjectContext(projectContext);
  }

  const handleApply = useCallback((suggestion: SmartSuggestion) => {
    onApplySuggestion(suggestion.prompt, suggestion.metadata);
  }, [onApplySuggestion]);

  const handleRefresh = useCallback(() => {
    analyze();
  }, [analyze]);

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className={cn("overflow-hidden", className)}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Smart Assistant</h3>
                <p className="text-[10px] text-muted-foreground">
                  {hasContext ? 'Персональные рекомендации' : 'Начните генерацию для анализа'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <Badge variant="secondary" className="text-xs">
                {suggestions.length} идей
              </Badge>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {/* Context badges */}
            {hasContext && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b bg-muted/30">
                {userContext && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <History className="h-3 w-3" />
                    {userContext.totalGenerations} генераций
                  </Badge>
                )}
                {userContext?.favoriteGenres.slice(0, 2).map(genre => (
                  <Badge key={genre} variant="secondary" className="text-[10px]">
                    {genre}
                  </Badge>
                ))}
                {projectContext && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Folder className="h-3 w-3" />
                    {projectContext.projectTitle}
                  </Badge>
                )}
              </div>
            )}

            {/* Suggestions list */}
            <ScrollArea className="h-[300px]">
              <div className="p-3 space-y-2">
                {error && (
                  <div className="text-center py-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {!error && suggestions.length === 0 && !isAnalyzing && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Создайте несколько треков,</p>
                    <p>чтобы получить персональные рекомендации</p>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {suggestions.map((suggestion, index) => (
                    <SmartSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={handleApply}
                      onDismiss={dismissSuggestion}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {lastAnalyzedAt 
                  ? `Обновлено: ${new Date(lastAnalyzedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Не анализировано'
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isAnalyzing}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className={cn("h-3 w-3", isAnalyzing && "animate-spin")} />
                Обновить
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});
