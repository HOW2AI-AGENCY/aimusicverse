/**
 * AI Assistant for lyrics writing
 * Provides completion, improvement, rhymes, and tag suggestions
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Sparkles,
  Wand2,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  RefreshCw,
  Tag,
  Languages,
  PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

type AIAction = 'complete' | 'improve' | 'rhyme' | 'translate' | 'generate_section' | 'suggest_tags';

interface LyricsAIAssistantProps {
  selectedText?: string;
  onInsertText?: (text: string) => void;
  onAddTags?: (tags: string[]) => void;
  context?: {
    genre?: string;
    mood?: string;
    language?: string;
    style?: string;
    existingLyrics?: string;
    sectionType?: string;
  };
}

const actionLabels: Record<AIAction, { label: string; icon: React.ElementType; description: string }> = {
  complete: { label: 'Продолжить', icon: PenLine, description: 'Продолжить текст' },
  improve: { label: 'Улучшить', icon: Wand2, description: 'Улучшить стиль и ритм' },
  rhyme: { label: 'Рифмы', icon: MessageSquare, description: 'Найти рифмы' },
  translate: { label: 'Перевод', icon: Languages, description: 'Перевести текст' },
  generate_section: { label: 'Генерация', icon: Sparkles, description: 'Сгенерировать секцию' },
  suggest_tags: { label: 'Теги', icon: Tag, description: 'Предложить теги' },
};

export function LyricsAIAssistant({
  selectedText = '',
  onInsertText,
  onAddTags,
  context,
}: LyricsAIAssistantProps) {
  const [input, setInput] = useState(selectedText);
  const [result, setResult] = useState<string | string[]>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<AIAction | null>(null);
  const [copied, setCopied] = useState(false);

  const executeAction = useCallback(async (action: AIAction) => {
    if (!input.trim() && action !== 'generate_section') {
      toast.error('Введите или выделите текст');
      return;
    }

    setIsLoading(true);
    setLastAction(action);
    hapticImpact('light');

    try {
      const { data, error } = await supabase.functions.invoke('lyrics-ai-assistant', {
        body: {
          action,
          content: input,
          context,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.result);
      hapticImpact('medium');
      
      // Auto-add tags if suggest_tags action
      if (action === 'suggest_tags' && Array.isArray(data.result) && onAddTags) {
        // Don't auto-add, let user choose
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Ошибка AI-ассистента');
    } finally {
      setIsLoading(false);
    }
  }, [input, context, onAddTags]);

  const handleCopy = useCallback(() => {
    const textToCopy = Array.isArray(result) ? result.join(', ') : result;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Скопировано');
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleInsert = useCallback(() => {
    if (onInsertText && typeof result === 'string') {
      onInsertText(result);
      toast.success('Текст вставлен');
      hapticImpact('light');
    }
  }, [result, onInsertText]);

  const handleAddAllTags = useCallback(() => {
    if (onAddTags && Array.isArray(result)) {
      onAddTags(result);
      toast.success(`Добавлено ${result.length} тегов`);
      hapticImpact('medium');
    }
  }, [result, onAddTags]);

  const handleAddTag = useCallback((tag: string) => {
    if (onAddTags) {
      onAddTags([tag]);
      hapticImpact('light');
    }
  }, [onAddTags]);

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI-ассистент</h3>
          <p className="text-xs text-muted-foreground">Помощь в написании лирики</p>
        </div>
      </div>

      {/* Input */}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите текст или выделите часть лирики..."
        className="min-h-[80px] resize-none text-sm"
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="default" 
              size="sm" 
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI-действия
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {Object.entries(actionLabels).map(([action, { label, icon: Icon, description }]) => (
              <DropdownMenuItem
                key={action}
                onClick={() => executeAction(action as AIAction)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => executeAction('complete')}
          disabled={isLoading || !input.trim()}
          className="gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          Продолжить
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => executeAction('suggest_tags')}
          disabled={isLoading || !input.trim()}
          className="gap-1.5"
        >
          <Tag className="w-3.5 h-3.5" />
          Теги
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {lastAction && actionLabels[lastAction]?.label}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                {lastAction && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => executeAction(lastAction)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags Result */}
            {Array.isArray(result) ? (
              <div className="space-y-2">
                <ScrollArea className="max-h-32">
                  <div className="flex flex-wrap gap-1.5">
                    {result.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
                {onAddTags && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={handleAddAllTags}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Добавить все теги
                  </Button>
                )}
              </div>
            ) : (
              /* Text Result */
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {result}
                </div>
                {onInsertText && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={handleInsert}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    Вставить в текст
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
