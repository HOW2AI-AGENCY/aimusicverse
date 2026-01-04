/**
 * LyricsChatAssistant - Unified AI Agent with fixed scrolling and visual editor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Send, MessageCircle, Tag, Lightbulb, X, 
  Bot, User, Loader2, Trash2, PenLine 
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTelegramMainButton } from '@/hooks/telegram';
import { useTelegram } from '@/contexts/TelegramContext';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';

// AI Agent system imports
import { AIToolbar } from '@/components/lyrics-workspace/ai-agent/AIToolbar';
import { useAITools } from '@/components/lyrics-workspace/ai-agent/hooks/useAITools';
import { WriteToolPanel, AnalyzeToolPanel, ProducerToolPanel, OptimizeToolPanel } from '@/components/lyrics-workspace/ai-agent/tools';
import { StructuredLyricsPreview, TagsResultCard, FullAnalysisResultCard, ProducerResultCard } from '@/components/lyrics-workspace/ai-agent/results';
import { AIToolId, AIAgentContext, AIMessage } from '@/components/lyrics-workspace/ai-agent/types';

// Legacy imports for compatibility
import { TagBuilderPanel } from './TagBuilderPanel';
import { ContextRecommendations, Recommendation } from './lyrics-chat/ContextRecommendations';
import { QuickActions } from './lyrics-chat/QuickActions';
import type { LyricsChatAssistantProps } from './lyrics-chat/types';
import type { LyricsQuickAction } from './lyrics-chat/quickActions';

export type { LyricsChatAssistantProps } from './lyrics-chat/types';

export function LyricsChatAssistant({
  open,
  onOpenChange,
  onLyricsGenerated,
  onStyleGenerated,
  onTitleGenerated,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
  projectContext,
  trackContext,
  initialMode = 'new',
}: LyricsChatAssistantProps) {
  const isMobile = useIsMobile();
  const { platform } = useTelegram();
  const isIOS = platform === 'ios';
  const [activeTab, setActiveTab] = useState<'chat' | 'tags' | 'ai' | 'quick'>('chat');
  const [openToolPanel, setOpenToolPanel] = useState<AIToolId | null>(null);
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  
  // Scrolling refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  
  // Keyboard-aware behavior для адаптации под клавиатуру iOS
  const { keyboardHeight, isKeyboardOpen, createFocusHandler } = useKeyboardAware();

  // Build AI agent context
  const aiContext: AIAgentContext = {
    existingLyrics: generatedLyrics,
    genre: initialGenre || projectContext?.genre,
    mood: initialMood?.[0] || projectContext?.mood,
    language: initialLanguage,
    projectContext: projectContext ? {
      projectId: projectContext.projectId || '',
      projectTitle: projectContext.projectTitle || '',
      projectType: projectContext.projectType,
      genre: projectContext.genre,
      mood: projectContext.mood,
      concept: projectContext.concept,
      targetAudience: projectContext.targetAudience,
      language: projectContext.language,
    } : undefined,
    trackContext: trackContext ? {
      position: trackContext.position || 0,
      title: trackContext.title || '',
      notes: trackContext.notes,
      recommendedTags: trackContext.recommendedTags,
      recommendedStructure: trackContext.recommendedStructure,
    } : undefined,
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
    context: aiContext,
    onLyricsGenerated: (lyrics) => {
      setGeneratedLyrics(lyrics);
      onLyricsGenerated(lyrics);
    },
    onTagsGenerated: (tags) => {
      // Append tags to lyrics
      if (generatedLyrics) {
        const tagsStr = tags.map(t => `[${t}]`).join(' ');
        const updatedLyrics = `${tagsStr}\n\n${generatedLyrics}`;
        setGeneratedLyrics(updatedLyrics);
        onLyricsGenerated(updatedLyrics);
      }
    },
    onStylePromptGenerated: onStyleGenerated,
    onTitleGenerated: onTitleGenerated,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current && shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isLoading]);

  // Handle user scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    shouldAutoScrollRef.current = isAtBottom;
  }, []);

  // Tool panel handlers
  const handleToolSelect = useCallback((toolId: AIToolId) => {
    hapticImpact('light');
    setOpenToolPanel(prev => prev === toolId ? null : toolId);
    setActiveTool(toolId);
  }, [setActiveTool]);

  const handleToolExecute = useCallback((toolId: AIToolId, toolInput: Record<string, any>) => {
    setOpenToolPanel(null);
    executeTool(toolId, toolInput);
  }, [executeTool]);

  // Input ref for maintaining focus
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Chat handlers - keep focus to prevent keyboard jump
  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    hapticImpact('light');
    sendChatMessage(input);
    setInput('');
    shouldAutoScrollRef.current = true;
    // Keep focus on input to prevent keyboard from closing abruptly
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [input, isLoading, sendChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Quick actions handler
  const handleQuickActionSelect = useCallback((action: LyricsQuickAction) => {
    sendChatMessage(action.prompt);
    setActiveTab('chat');
  }, [sendChatMessage]);

  // Tags handler
  const handleTagsGenerated = useCallback((tags: string) => {
    if (generatedLyrics) {
      const updatedLyrics = `${tags}\n\n${generatedLyrics}`;
      setGeneratedLyrics(updatedLyrics);
      onLyricsGenerated(updatedLyrics);
    } else {
      setInput(`Создай текст с тегами: ${tags}`);
    }
    setActiveTab('chat');
  }, [generatedLyrics, onLyricsGenerated]);

  // Recommendations handler
  const handleRecommendationSelect = useCallback((rec: Recommendation) => {
    if (rec.type === 'theme') {
      sendChatMessage(rec.value);
    } else if (rec.type === 'tag') {
      if (generatedLyrics) {
        const updatedLyrics = `[${rec.value}]\n${generatedLyrics}`;
        setGeneratedLyrics(updatedLyrics);
        onLyricsGenerated(updatedLyrics);
      } else {
        setInput(`Добавь тег [${rec.value}] в текст`);
      }
    }
    setActiveTab('chat');
  }, [sendChatMessage, generatedLyrics, onLyricsGenerated]);

  // Apply lyrics to form
  const handleApplyLyrics = useCallback(() => {
    if (generatedLyrics) {
      onLyricsGenerated(generatedLyrics);
      toast.success('Текст применён');
      onOpenChange(false);
    }
  }, [generatedLyrics, onLyricsGenerated, onOpenChange]);

  // Telegram MainButton
  const { shouldShowUIButton } = useTelegramMainButton({
    text: 'ПРИМЕНИТЬ',
    onClick: handleApplyLyrics,
    enabled: !!generatedLyrics && !isLoading,
    visible: !isIOS && open && !!generatedLyrics,
  });

  const showApplyUIButton = isIOS ? true : shouldShowUIButton;

  // Render tool panel
  const renderToolPanel = () => {
    if (!openToolPanel) return null;
    
    const panelProps = {
      context: aiContext,
      onExecute: (toolInput: Record<string, any>) => handleToolExecute(openToolPanel, toolInput),
      onClose: () => setOpenToolPanel(null),
      isLoading,
    };

    switch (openToolPanel) {
      case 'write': return <WriteToolPanel {...panelProps} />;
      case 'analyze': return <AnalyzeToolPanel {...panelProps} />;
      case 'producer': return <ProducerToolPanel {...panelProps} />;
      case 'optimize': return <OptimizeToolPanel {...panelProps} />;
      default: return null;
    }
  };

  // Render message content based on data
  const renderMessageContent = (message: AIMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Думаю...</span>
        </div>
      );
    }

    return (
      <>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        {/* Lyrics result */}
        {message.data?.lyrics && (
          <StructuredLyricsPreview
            lyrics={message.data.lyrics}
            onInsert={(lyrics) => {
              const updatedLyrics = generatedLyrics ? `${generatedLyrics}\n\n${lyrics}` : lyrics;
              setGeneratedLyrics(updatedLyrics);
              onLyricsGenerated(updatedLyrics);
            }}
            onReplace={(lyrics) => {
              setGeneratedLyrics(lyrics);
              onLyricsGenerated(lyrics);
            }}
            showReplace={!!generatedLyrics}
          />
        )}
        
        {/* Tags result */}
        {message.data?.tags && message.data.tags.length > 0 && (
          <TagsResultCard 
            tags={message.data.tags} 
            onApply={(tags) => {
              if (generatedLyrics) {
                const tagsStr = tags.map(t => `[${t}]`).join(' ');
                const updatedLyrics = `${tagsStr}\n\n${generatedLyrics}`;
                setGeneratedLyrics(updatedLyrics);
                onLyricsGenerated(updatedLyrics);
              }
            }} 
          />
        )}

        {/* Full analysis result */}
        {message.data?.fullAnalysis && (
          <FullAnalysisResultCard
            analysis={message.data.fullAnalysis}
            onQuickAction={(action) => sendChatMessage(action)}
            onApplyRecommendations={(recs) => {
              const formattedRecs = recs.map((r, i) => `${i + 1}. ${r}`).join('\n');
              sendChatMessage(`Примени следующие рекомендации к тексту:\n${formattedRecs}`);
            }}
          />
        )}

        {/* Producer review result */}
        {message.data?.producerReview && (
          <ProducerResultCard
            review={message.data.producerReview}
            onQuickAction={(action) => sendChatMessage(action)}
            onApplyStylePrompt={onStyleGenerated}
            onApplyTags={(tags) => {
              if (generatedLyrics) {
                const tagsStr = tags.map(t => `[${t}]`).join(' ');
                const updatedLyrics = `${tagsStr}\n\n${generatedLyrics}`;
                setGeneratedLyrics(updatedLyrics);
                onLyricsGenerated(updatedLyrics);
              }
            }}
          />
        )}
      </>
    );
  };

  // Get title based on context
  const getTitle = () => {
    if (trackContext?.title) return `Лирика: ${trackContext.title}`;
    if (projectContext?.projectTitle) return projectContext.projectTitle;
    return 'AI Lyrics Agent';
  };

  const chatContent = (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      {/* AI Toolbar */}
      <div className="border-b border-border/50 shrink-0">
        <AIToolbar 
          activeTool={activeTool} 
          onSelectTool={handleToolSelect} 
          isLoading={isLoading}
          className="px-2"
        />
      </div>

      {/* Tool Panel */}
      <AnimatePresence mode="wait">
        {renderToolPanel()}
      </AnimatePresence>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="shrink-0 px-4 pt-2">
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="chat" className="text-xs gap-1">
            <MessageCircle className="h-3 w-3" />
            Чат
          </TabsTrigger>
          <TabsTrigger value="quick" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Быстро
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs gap-1">
            <Tag className="h-3 w-3" />
            Теги
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs gap-1">
            <Lightbulb className="h-3 w-3" />
            AI
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Contents - Fixed height scrollable area - takes all remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto overscroll-contain px-4 py-3"
          >
            <div className="space-y-3 pb-4">
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
                      {renderMessageContent(message)}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-bl-sm border border-border/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Думаю...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quick' && (
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-4">
            <QuickActions
              hasLyrics={!!generatedLyrics}
              onActionSelect={handleQuickActionSelect}
            />
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-4">
            <TagBuilderPanel
              onTagsGenerated={handleTagsGenerated}
              genre={initialGenre || projectContext?.genre}
              mood={initialMood?.[0] || projectContext?.mood}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-4">
            <ContextRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecs}
              onRefresh={() => setIsLoadingRecs(true)}
              onSelect={handleRecommendationSelect}
            />
            {!isLoadingRecs && recommendations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Рекомендации недоступны</p>
                <p className="text-xs mt-1">Добавьте контекст проекта для получения AI-рекомендаций</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - Only show in chat tab */}
      {activeTab === 'chat' && (
        <div 
          className="border-t border-border/50 p-3 bg-background/80 backdrop-blur-sm shrink-0"
          style={{
            // Применяем padding для клавиатуры + safe-area
            paddingBottom: isKeyboardOpen
              ? `${keyboardHeight + 12}px`
              : 'max(0.75rem, env(safe-area-inset-bottom))',
            transition: 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 shrink-0" 
              onClick={clearMessages}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Textarea
              ref={inputRef}
              placeholder="Опишите задачу или задайте вопрос..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={createFocusHandler()}
              className="min-h-[36px] max-h-[100px] resize-none text-sm flex-1"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              className="h-9 w-9 shrink-0" 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Apply button */}
          {showApplyUIButton && generatedLyrics && (
            <Button 
              onClick={handleApplyLyrics} 
              className="w-full mt-2 gap-2"
              disabled={isLoading}
            >
              <PenLine className="w-4 h-4" />
              Применить текст
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Use fullscreen Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          className="flex flex-col rounded-none overflow-hidden"
          style={{
            // Fixed positioning with Telegram safe areas
            position: 'fixed',
            top: 'calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px))',
            left: 0,
            right: 0,
            bottom: 0,
            height: 'auto',
            maxHeight: 'none',
          }}
        >
          <DrawerHeader 
            className="pb-2 border-b border-border/50 shrink-0 flex items-center justify-between"
            style={{
              // Extra padding for header on iOS
              paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            }}
          >
            <DrawerTitle className="flex items-center gap-2 text-base">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="truncate">{getTitle()}</span>
            </DrawerTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerHeader>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {chatContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {chatContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
