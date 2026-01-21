/**
 * LyricsAIChatAgent - Refactored with modular AI tools system
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

import { AIToolbar } from './ai-agent/AIToolbar';
import { useAITools } from './ai-agent/hooks/useAITools';
import { 
  WriteToolPanel, AnalyzeToolPanel, ProducerToolPanel, OptimizeToolPanel, RhymeToolPanel,
  ContinueToolPanel, StructureToolPanel, StyleConvertToolPanel, TranslateToolPanel
} from './ai-agent/tools';
import { StructuredLyricsPreview, TagsResultCard, FullAnalysisResultCard, ProducerResultCard } from './ai-agent/results';
import { AIToolId, AIAgentContext, SectionNote } from './ai-agent/types';

interface LyricsAIChatAgentProps {
  existingLyrics?: string;
  selectedSection?: { type: string; content: string; notes?: string; tags?: string[] };
  globalTags?: string[];
  sectionTags?: string[];
  allSectionNotes?: SectionNote[];
  stylePrompt?: string;
  title?: string;
  genre?: string;
  mood?: string;
  // Project context
  projectContext?: {
    projectId: string;
    projectTitle: string;
    projectType?: string;
    genre?: string;
    mood?: string;
    concept?: string;
    targetAudience?: string;
    referenceArtists?: string[];
    language?: string;
  };
  trackContext?: {
    position: number;
    title: string;
    notes?: string;
    recommendedTags?: string[];
    recommendedStructure?: string;
  };
  tracklist?: Array<{
    position: number;
    title: string;
    hasLyrics: boolean;
    status?: string;
  }>;
  onInsertLyrics?: (lyrics: string) => void;
  onReplaceLyrics?: (lyrics: string) => void;
  onAddTags?: (tags: string[]) => void;
  onApplyStylePrompt?: (prompt: string) => void;
  className?: string;
}

export function LyricsAIChatAgent({
  existingLyrics = '',
  selectedSection,
  globalTags = [],
  sectionTags = [],
  allSectionNotes = [],
  stylePrompt,
  title,
  genre,
  mood,
  projectContext,
  trackContext,
  tracklist,
  onInsertLyrics,
  onReplaceLyrics,
  onAddTags,
  onApplyStylePrompt,
  className,
}: LyricsAIChatAgentProps) {
  const [input, setInput] = useState('');
  const [openToolPanel, setOpenToolPanel] = useState<AIToolId | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const context: AIAgentContext = {
    existingLyrics,
    selectedSection,
    globalTags,
    sectionTags,
    allSectionNotes,
    stylePrompt,
    title,
    genre: genre || projectContext?.genre,
    mood: mood || projectContext?.mood,
    projectContext,
    trackContext,
    tracklist,
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
    onLyricsGenerated: onReplaceLyrics, // Quick actions should replace, not insert
    onTagsGenerated: onAddTags,
    onStylePromptGenerated: onApplyStylePrompt,
  });

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleToolSelect = useCallback((toolId: AIToolId) => {
    hapticImpact('light');
    setOpenToolPanel(prev => prev === toolId ? null : toolId);
    setActiveTool(toolId);
  }, [setActiveTool]);

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

  const handleQuickAction = useCallback((action: string) => {
    sendChatMessage(action);
  }, [sendChatMessage]);

  const handleApplyRecommendations = useCallback((recommendations: string[]) => {
    const formattedRecs = recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
    sendChatMessage(`Примени следующие рекомендации к тексту:\n${formattedRecs}`);
  }, [sendChatMessage]);

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
      case 'continue': return <ContinueToolPanel {...panelProps} />;
      case 'analyze': return <AnalyzeToolPanel {...panelProps} />;
      case 'producer': return <ProducerToolPanel {...panelProps} />;
      case 'optimize': return <OptimizeToolPanel {...panelProps} />;
      case 'rhyme': return <RhymeToolPanel {...panelProps} />;
      case 'structure': return <StructureToolPanel {...panelProps} />;
      case 'style_convert': return <StyleConvertToolPanel {...panelProps} />;
      case 'translate': return <TranslateToolPanel {...panelProps} />;
      default: return null;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="border-b border-border/50">
        <AIToolbar activeTool={activeTool} onSelectTool={handleToolSelect} isLoading={isLoading} />
      </div>

      <AnimatePresence mode="wait">{renderToolPanel()}</AnimatePresence>

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
                        <StructuredLyricsPreview
                          lyrics={message.data.lyrics}
                          onInsert={onInsertLyrics}
                          onReplace={onReplaceLyrics}
                          showReplace={!!existingLyrics}
                        />
                      )}
                      
                      {message.data?.tags && message.data.tags.length > 0 && (
                        <TagsResultCard tags={message.data.tags} onApply={onAddTags} />
                      )}

                      {message.data?.fullAnalysis && (
                        <FullAnalysisResultCard
                          analysis={message.data.fullAnalysis}
                          onQuickAction={handleQuickAction}
                          onApplyRecommendations={handleApplyRecommendations}
                        />
                      )}

                      {message.data?.producerReview && (
                        <ProducerResultCard
                          review={message.data.producerReview}
                          onQuickAction={handleQuickAction}
                          onApplyStylePrompt={onApplyStylePrompt}
                          onApplyTags={onAddTags}
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
    </div>
  );
}
