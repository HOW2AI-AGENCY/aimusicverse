/**
 * LyricsAIChatAgent - Professional AI agent for lyrics creation
 * 
 * Features:
 * - Full lyrics generation on demand
 * - Context-aware continuation
 * - Hook creation
 * - Tag suggestions
 * - Structure improvement
 * - Rhyme analysis
 * - Beat/meter optimization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Send,
  Loader2,
  Sparkles,
  Wand2,
  PenLine,
  Tag,
  RefreshCw,
  Copy,
  Check,
  Bot,
  User,
  Music2,
  Zap,
  Target,
  Mic2,
  LayoutGrid,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'lyrics' | 'tags' | 'analysis';
  data?: {
    lyrics?: string;
    tags?: string[];
    suggestions?: string[];
  };
}

interface LyricsAIChatAgentProps {
  existingLyrics?: string;
  selectedSection?: {
    type: string;
    content: string;
  };
  globalTags?: string[];
  sectionTags?: string[];
  onInsertLyrics?: (lyrics: string) => void;
  onReplaceLyrics?: (lyrics: string) => void;
  onAddTags?: (tags: string[]) => void;
  className?: string;
}

// Expanded quick actions with all 7 capabilities
const QUICK_ACTIONS = [
  { 
    id: 'write',
    label: 'Написать', 
    prompt: 'Напиши полный текст песни на тему', 
    icon: PenLine,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Полный текст'
  },
  { 
    id: 'continue',
    label: 'Продолжить', 
    prompt: 'Проанализируй контекст и продолжи текст, сохраняя стиль и настроение', 
    icon: Zap,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    description: 'Дописать текст'
  },
  { 
    id: 'hook',
    label: 'Хук', 
    prompt: 'Создай запоминающийся хук или припев для этой песни', 
    icon: Target,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/30',
    description: 'Создать хук'
  },
  { 
    id: 'tags',
    label: 'Теги', 
    prompt: 'Проанализируй текст и предложи оптимальные теги для Suno V5', 
    icon: Tag,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    description: 'Добавить теги'
  },
  { 
    id: 'structure',
    label: 'Структура', 
    prompt: 'Улучши структуру песни, добавь недостающие секции и переходы', 
    icon: LayoutGrid,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Улучшить структуру'
  },
  { 
    id: 'rhymes',
    label: 'Рифмы', 
    prompt: 'Проанализируй рифмы и предложи улучшения для более богатой рифмовки', 
    icon: Mic2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'Улучшить рифмы'
  },
  { 
    id: 'rhythm',
    label: 'Такт', 
    prompt: 'Оптимизируй текст для лучшего соответствия музыкальному такту и ритму', 
    icon: Music2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    description: 'Подогнать под такт'
  },
  { 
    id: 'improve',
    label: 'Улучшить', 
    prompt: 'Улучши качество текста: добавь метафоры, усиль образность, прокачай подачу', 
    icon: Wand2,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
    description: 'Общее улучшение'
  },
];

export function LyricsAIChatAgent({
  existingLyrics = '',
  selectedSection,
  globalTags = [],
  sectionTags = [],
  onInsertLyrics,
  onReplaceLyrics,
  onAddTags,
  className,
}: LyricsAIChatAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я AI-помощник для создания лирики. Выберите действие или опишите, что вам нужно.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string, action?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowActions(false);
    hapticImpact('light');

    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: action || 'chat',
          message: text,
          context: {
            existingLyrics,
            sectionType: selectedSection?.type,
            sectionContent: selectedSection?.content,
            globalTags,
            sectionTags,
          },
        },
      });

      if (error) {
        // Handle rate limit and payment errors
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Превышен лимит запросов. Подождите немного.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast.error('Необходимо пополнить баланс AI.');
        }
        throw error;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.result || 'Готово!',
        type: data.lyrics ? 'lyrics' : data.tags ? 'tags' : data.suggestions ? 'analysis' : 'text',
        data: {
          lyrics: data.lyrics,
          tags: data.tags,
          suggestions: data.suggestions,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      hapticImpact('medium');
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Произошла ошибка. Попробуйте ещё раз.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [existingLyrics, selectedSection, globalTags, sectionTags, isLoading]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    let fullPrompt = action.prompt;
    
    // Add context based on action
    if (selectedSection?.content && ['continue', 'improve', 'rhymes', 'rhythm'].includes(action.id)) {
      fullPrompt = `${action.prompt}:\n\n"${selectedSection.content.substring(0, 500)}${selectedSection.content.length > 500 ? '...' : ''}"`;
    } else if (existingLyrics && ['continue', 'hook', 'structure', 'rhymes', 'rhythm', 'tags'].includes(action.id)) {
      const lyricsPreview = existingLyrics.substring(0, 600);
      fullPrompt = `${action.prompt}. Вот текущий текст:\n\n"${lyricsPreview}${existingLyrics.length > 600 ? '...' : ''}"`;
    }
    
    hapticImpact('light');
    sendMessage(fullPrompt, action.id === 'tags' ? 'add_tags' : action.id === 'structure' ? 'suggest_structure' : 'chat');
  }, [selectedSection, existingLyrics, sendMessage]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Скопировано');
    hapticImpact('light');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleInsertLyrics = useCallback((lyrics: string) => {
    onInsertLyrics?.(lyrics);
    toast.success('Текст добавлен');
    hapticImpact('medium');
  }, [onInsertLyrics]);

  const handleReplaceLyrics = useCallback((lyrics: string) => {
    onReplaceLyrics?.(lyrics);
    toast.success('Текст заменён');
    hapticImpact('medium');
  }, [onReplaceLyrics]);

  const handleAddTags = useCallback((tags: string[]) => {
    onAddTags?.(tags);
    toast.success(`Добавлено ${tags.length} тегов`);
    hapticImpact('medium');
  }, [onAddTags]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Quick Actions - Collapsible */}
      <div className="border-b border-border/50">
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-full px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium">Быстрые действия</span>
          </span>
          {showActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 grid grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      action.bgColor,
                      isLoading && "opacity-50"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <action.icon className={cn("w-5 h-5", action.color)} />
                    <span className="text-[10px] font-medium text-foreground/80 leading-tight text-center">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context indicator */}
      {(selectedSection || existingLyrics) && (
        <div className="px-3 py-2 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="p-1 rounded bg-primary/10">
              <Music2 className="w-3 h-3 text-primary" />
            </div>
            {selectedSection ? (
              <span>Выбрана секция: <span className="font-medium text-foreground">{selectedSection.type}</span></span>
            ) : existingLyrics ? (
              <span>Контекст: <span className="font-medium text-foreground">{existingLyrics.length} симв.</span></span>
            ) : null}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/80 rounded-bl-md border border-border/50"
                )}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* Lyrics result */}
                  {message.data?.lyrics && (
                    <div className="mt-3 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3">
                      <p className="text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed max-h-[200px] overflow-y-auto">
                        {message.data.lyrics}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs gap-1.5 rounded-lg"
                          onClick={() => handleCopy(message.data!.lyrics!, message.id)}
                        >
                          {copiedId === message.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Копировать
                        </Button>
                        {onInsertLyrics && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 rounded-lg"
                            onClick={() => handleInsertLyrics(message.data!.lyrics!)}
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            Добавить
                          </Button>
                        )}
                        {onReplaceLyrics && selectedSection && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 rounded-lg"
                            onClick={() => handleReplaceLyrics(message.data!.lyrics!)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Заменить
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags result */}
                  {message.data?.tags && message.data.tags.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {message.data.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs rounded-md">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {onAddTags && (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 rounded-lg"
                          onClick={() => handleAddTags(message.data!.tags!)}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          Добавить все
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.data?.suggestions && message.data.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Предложения:</p>
                      <div className="space-y-1.5">
                        {message.data.suggestions.map((suggestion, idx) => (
                          <div 
                            key={idx}
                            className="text-xs p-2 bg-background/50 rounded-lg border border-border/30"
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted/80 rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Генерирую</span>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm text-muted-foreground"
                  >
                    ...
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input - Fixed at bottom with safe area */}
      <div 
        className="p-3 border-t border-border/50 bg-background/95 backdrop-blur-sm"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))'
        }}
      >
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите, что нужно написать..."
            className="min-h-[44px] max-h-[100px] resize-none text-sm rounded-xl bg-muted/50 border-border/50"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-11 w-11 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
