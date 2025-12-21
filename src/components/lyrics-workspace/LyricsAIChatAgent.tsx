/**
 * LyricsAIChatAgent - Refactored with modular AI tools system
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Send, Loader2, Bot, User, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

import { AIToolbar } from './ai-agent/AIToolbar';
import { useAITools } from './ai-agent/hooks/useAITools';
import { WriteToolPanel, TagsToolPanel, RhymeToolPanel, AnalysisToolPanel, QuickToolPanel } from './ai-agent/tools';
import { LyricsResultCard, TagsResultCard, RhythmAnalyzer, RhythmResultCard } from './ai-agent/results';
import { AIToolId, AIAgentContext } from './ai-agent/types';

interface LyricsAIChatAgentProps {
  existingLyrics?: string;
  selectedSection?: { type: string; content: string };
  globalTags?: string[];
  sectionTags?: string[];
  genre?: string;
  mood?: string;
  onInsertLyrics?: (lyrics: string) => void;
  onReplaceLyrics?: (lyrics: string) => void;
  onAddTags?: (tags: string[]) => void;
  className?: string;
}

export function LyricsAIChatAgent({
  existingLyrics = '',
  selectedSection,
  globalTags = [],
  sectionTags = [],
  genre,
  mood,
  onInsertLyrics,
  onReplaceLyrics,
  onAddTags,
  className,
}: LyricsAIChatAgentProps) {
  const [input, setInput] = useState('');
  const [openToolPanel, setOpenToolPanel] = useState<AIToolId | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'rhythm'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  const context: AIAgentContext = {
    existingLyrics,
    selectedSection,
    globalTags,
    sectionTags,
    genre,
    mood,
  };

  const {
    messages,
    isLoading,
    activeTool,
    executeTool,
    sendChatMessage,
    clearMessages,
    setActiveTool,
  } = useAITools({
    context,
    onLyricsGenerated: onInsertLyrics,
    onTagsGenerated: onAddTags,
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleToolSelect = useCallback((toolId: AIToolId) => {
    hapticImpact('light');
    if (openToolPanel === toolId) {
      setOpenToolPanel(null);
    } else {
      setOpenToolPanel(toolId);
    }
    setActiveTool(toolId);
  }, [openToolPanel, setActiveTool]);

  const handleToolExecute = useCallback((toolId: AIToolId, input: Record<string, any>) => {
    setOpenToolPanel(null);
    executeTool(toolId, input);
  }, [executeTool]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendChatMessage(input);
    setInput('');
  }, [input, isLoading, sendChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const renderToolPanel = () => {
    if (!openToolPanel) return null;
    
    const panelProps = {
      context,
      onExecute: (input: Record<string, any>) => handleToolExecute(openToolPanel, input),
      onClose: () => setOpenToolPanel(null),
      isLoading,
    };

    switch (openToolPanel) {
      case 'write': return <WriteToolPanel {...panelProps} />;
      case 'tags': return <TagsToolPanel {...panelProps} />;
      case 'rhymes': return <RhymeToolPanel {...panelProps} />;
      case 'rhythm': return <AnalysisToolPanel {...panelProps} toolId="rhythm" />;
      case 'structure': return <AnalysisToolPanel {...panelProps} toolId="structure" />;
      case 'continue':
      case 'hook':
      case 'optimize':
        return <QuickToolPanel {...panelProps} toolId={openToolPanel} />;
      default: return null;
    }
  };

  const handleRhythmFix = useCallback((lineIndex: number, suggestion: string) => {
    executeTool('optimize', { 
      message: `Исправь ритм в строке ${lineIndex + 1}: ${suggestion}`,
      existingLyrics,
    });
    setActiveTab('chat');
  }, [executeTool, existingLyrics]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Toolbar */}
      <div className="border-b border-border/50">
        <AIToolbar
          activeTool={activeTool}
          onSelectTool={handleToolSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Active Tool Panel */}
      <AnimatePresence mode="wait">
        {renderToolPanel()}
      </AnimatePresence>

      {/* Tab Switcher */}
      <div className="px-3 pt-2">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === 'chat' 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="w-3.5 h-3.5" />
            Чат
          </button>
          <button
            onClick={() => setActiveTab('rhythm')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === 'rhythm' 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Анализ ритма
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex flex-col min-h-0"
          >
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
                      className={cn("flex gap-2", message.role === 'user' ? "justify-end" : "justify-start")}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2",
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/80 rounded-bl-sm border border-border/50"
                      )}>
                        {message.isLoading ? (
                          <div className="flex items-center gap-2 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Думаю...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            
                            {message.data?.lyrics && (
                              <LyricsResultCard
                                lyrics={message.data.lyrics}
                                onInsert={onInsertLyrics}
                                onReplace={onReplaceLyrics}
                                showReplace={!!selectedSection}
                              />
                            )}
                            
                            {message.data?.tags && message.data.tags.length > 0 && (
                              <TagsResultCard
                                tags={message.data.tags}
                                onApply={onAddTags}
                              />
                            )}

                            {message.data?.analysis?.rhythm && (
                              <RhythmResultCard
                                analysis={message.data.analysis}
                                onOptimize={() => executeTool('optimize', {})}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border/50 p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearMessages}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Textarea
                  placeholder="Опишите задачу или задайте вопрос..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[36px] max-h-[100px] resize-none text-sm"
                  rows={1}
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="rhythm"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-auto p-3"
          >
            <RhythmAnalyzer
              lyrics={existingLyrics}
              onFixSuggestion={handleRhythmFix}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
