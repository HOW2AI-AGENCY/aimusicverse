/**
 * LyricsAIChatAgent - Conversational AI agent for lyrics
 * 
 * Features:
 * - Chat-based interface for natural language interaction
 * - Context-aware (tags, sections, existing lyrics)
 * - Write, improve, continue lyrics
 * - Suggest tags and structure
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
  ChevronDown,
  Bot,
  User
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
  type?: 'text' | 'lyrics' | 'tags';
  data?: {
    lyrics?: string;
    tags?: string[];
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

const QUICK_ACTIONS = [
  { label: 'Написать куплет', prompt: 'Напиши куплет', icon: PenLine },
  { label: 'Написать припев', prompt: 'Напиши припев', icon: Sparkles },
  { label: 'Улучшить текст', prompt: 'Улучши этот текст', icon: Wand2 },
  { label: 'Предложить теги', prompt: 'Предложи теги для этого текста', icon: Tag },
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
      content: 'Привет! Я помогу написать, улучшить или продолжить лирику. Опишите, что вам нужно, или выберите быстрое действие.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    hapticImpact('light');

    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'chat',
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

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.result || 'Готово!',
        type: data.lyrics ? 'lyrics' : data.tags ? 'tags' : 'text',
        data: {
          lyrics: data.lyrics,
          tags: data.tags,
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
      toast.error('Ошибка AI-ассистента');
    } finally {
      setIsLoading(false);
    }
  }, [existingLyrics, selectedSection, globalTags, sectionTags, isLoading]);

  const handleQuickAction = useCallback((prompt: string) => {
    // If there's selected section content, include it
    const fullPrompt = selectedSection?.content 
      ? `${prompt}: "${selectedSection.content.substring(0, 200)}${selectedSection.content.length > 200 ? '...' : ''}"`
      : prompt;
    sendMessage(fullPrompt);
  }, [selectedSection, sendMessage]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Скопировано');
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
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
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
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Lyrics result */}
                  {message.data?.lyrics && (
                    <div className="mt-2 p-2 bg-background/50 rounded-lg space-y-2">
                      <p className="text-xs font-mono whitespace-pre-wrap">{message.data.lyrics}</p>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs gap-1"
                          onClick={() => handleCopy(message.data!.lyrics!, message.id)}
                        >
                          {copiedId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Копировать
                        </Button>
                        {onInsertLyrics && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-xs gap-1"
                            onClick={() => handleInsertLyrics(message.data!.lyrics!)}
                          >
                            <PenLine className="w-3 h-3" />
                            Добавить
                          </Button>
                        )}
                        {onReplaceLyrics && selectedSection && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs gap-1"
                            onClick={() => handleReplaceLyrics(message.data!.lyrics!)}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Заменить
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags result */}
                  {message.data?.tags && message.data.tags.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {message.data.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {onAddTags && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs gap-1"
                          onClick={() => handleAddTags(message.data!.tags!)}
                        >
                          <Tag className="w-3 h-3" />
                          Добавить все
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
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
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                <p className="text-sm text-muted-foreground">Думаю...</p>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.prompt}
              variant="outline"
              size="sm"
              className="shrink-0 h-7 text-xs gap-1"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите, что нужно написать..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-10 w-10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
