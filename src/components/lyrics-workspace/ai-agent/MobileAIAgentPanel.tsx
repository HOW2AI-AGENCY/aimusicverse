/**
 * MobileAIAgentPanel - Full-screen mobile AI agent for lyrics
 * Telegram mini app optimized with safe areas and native buttons
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Send, Loader2, Bot, User, Trash2, X, Sparkles,
  PenLine, Wand2, BarChart3, Headphones, Quote, Tag, Mic, MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { useVoiceInput } from '@/hooks/useVoiceInput';

import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { useAITools } from './hooks/useAITools';
import { WriteToolPanel, AnalyzeToolPanel, ProducerToolPanel, OptimizeToolPanel, RhymeToolPanel, TagsToolPanel } from './tools';
import { StructuredLyricsDisplay } from './results/StructuredLyricsDisplay';
import { AIProgressIndicator } from './AIProgressIndicator';
import { QuickActionsBar } from './QuickActionsBar';
import { AIToolId, AIAgentContext, SectionNote, AIMessage } from './types';

interface MobileAIAgentPanelProps {
  existingLyrics?: string;
  selectedSection?: { type: string; content: string; notes?: string; tags?: string[] };
  globalTags?: string[];
  sectionTags?: string[];
  allSectionNotes?: SectionNote[];
  stylePrompt?: string;
  title?: string;
  genre?: string;
  mood?: string;
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
  onClose: () => void;
  isOpen: boolean;
}

const QUICK_TOOLS = [
  { id: 'write' as AIToolId, icon: PenLine, label: 'Написать', color: 'text-blue-400' },
  { id: 'rhyme' as AIToolId, icon: Quote, label: 'Рифмы', color: 'text-cyan-400' },
  { id: 'tags' as AIToolId, icon: Tag, label: 'Теги', color: 'text-emerald-400' },
  { id: 'analyze' as AIToolId, icon: BarChart3, label: 'Анализ', color: 'text-purple-400' },
  { id: 'producer' as AIToolId, icon: Headphones, label: 'Продюсер', color: 'text-amber-400' },
  { id: 'optimize' as AIToolId, icon: Wand2, label: 'Suno', color: 'text-primary' },
];

const WORKFLOW_STEPS = [
  { step: 1, label: 'Концепт', description: 'Тема и настроение' },
  { step: 2, label: 'Структура', description: 'Секции песни' },
  { step: 3, label: 'Текст', description: 'Написание лирики' },
  { step: 4, label: 'Теги', description: 'Мета-теги Suno' },
  { step: 5, label: 'Финализация', description: 'Проверка и оптимизация' },
];

export function MobileAIAgentPanel({
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
  onClose,
  isOpen,
}: MobileAIAgentPanelProps) {
  const [input, setInput] = useState('');
  const [openToolPanel, setOpenToolPanel] = useState<AIToolId | null>(null);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(1);
  const [showQuickActions, setShowQuickActions] = useState(true);
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
    onLyricsGenerated: onReplaceLyrics,
    onTagsGenerated: onAddTags,
    onStylePromptGenerated: onApplyStylePrompt,
  });

  // Voice input for chat
  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onResult: (text) => {
      setInput(prev => prev ? `${prev} ${text}` : text);
    },
    context: 'lyrics',
    autoCorrect: true,
  });
  const hasGeneratedLyrics = useMemo(() => {
    return messages.some(m => m.role === 'assistant' && m.data?.lyrics);
  }, [messages]);

  // Get the latest generated lyrics
  const latestLyrics = useMemo(() => {
    const lyricsMessages = messages.filter(m => m.role === 'assistant' && m.data?.lyrics);
    return lyricsMessages.length > 0 ? lyricsMessages[lyricsMessages.length - 1].data?.lyrics : null;
  }, [messages]);

  // Telegram main button - only show when lyrics are available
  useTelegramMainButton({
    text: 'ПРИМЕНИТЬ ЛИРИКУ',
    onClick: () => {
      if (latestLyrics) {
        onReplaceLyrics?.(latestLyrics);
        hapticImpact('medium');
        onClose();
      }
    },
    visible: hasGeneratedLyrics && isOpen && !isLoading,
    color: '#22c55e',
    textColor: '#ffffff',
  });

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Update workflow step based on conversation
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' && !lastMessage.isLoading) {
      if (lastMessage.data?.lyrics) setCurrentWorkflowStep(Math.max(currentWorkflowStep, 3));
      if (lastMessage.data?.tags?.length) setCurrentWorkflowStep(Math.max(currentWorkflowStep, 4));
      if (lastMessage.type === 'producer_review' || lastMessage.type === 'full_analysis') {
        setCurrentWorkflowStep(5);
      }
    }
  }, [messages, currentWorkflowStep]);

  const handleToolSelect = useCallback((toolId: AIToolId) => {
    hapticImpact('light');
    setOpenToolPanel(prev => prev === toolId ? null : toolId);
    setActiveTool(toolId);
  }, [setActiveTool]);

  const handleToolExecute = useCallback((toolId: AIToolId, input: Record<string, unknown>) => {
    setOpenToolPanel(null);
    executeTool(toolId, input);
  }, [executeTool]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendChatMessage(input);
    setInput('');
    setShowQuickActions(false);
  }, [input, isLoading, sendChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleQuickAction = useCallback((action: string) => {
    sendChatMessage(action);
    setShowQuickActions(false);
  }, [sendChatMessage]);

  const handleApplyLyrics = useCallback((lyrics: string) => {
    onReplaceLyrics?.(lyrics);
    hapticImpact('medium');
  }, [onReplaceLyrics]);

  const renderToolPanel = () => {
    if (!openToolPanel) return null;
    
    const panelProps = {
      context,
      onExecute: (input: Record<string, unknown>) => handleToolExecute(openToolPanel, input),
      onClose: () => setOpenToolPanel(null),
      isLoading,
    };

    switch (openToolPanel) {
      case 'write': return <WriteToolPanel {...panelProps} />;
      case 'analyze': return <AnalyzeToolPanel {...panelProps} />;
      case 'producer': return <ProducerToolPanel {...panelProps} />;
      case 'optimize': return <OptimizeToolPanel {...panelProps} />;
      case 'rhyme': return <RhymeToolPanel {...panelProps} />;
      case 'tags': return <TagsToolPanel {...panelProps} />;
      default: return null;
    }
  };

  const renderMessage = (message: AIMessage) => {
    if (message.isLoading) {
      return (
        <AIProgressIndicator 
          isLoading={true} 
          step={activeTool || 'processing'}
          message="Генерирую..."
        />
      );
    }

    return (
      <>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        {/* Structured lyrics display */}
        {message.data?.lyrics && (
          <StructuredLyricsDisplay
            lyrics={message.data.lyrics}
            onApply={() => handleApplyLyrics(message.data!.lyrics!)}
            onInsert={onInsertLyrics}
            showApplyButton={!!onReplaceLyrics}
          />
        )}
        
        {/* Tags result */}
        {message.data?.tags && message.data.tags.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.data.tags.slice(0, 8).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {message.data.tags.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{message.data.tags.length - 8}
                </Badge>
              )}
            </div>
            {onAddTags && (
              <Button
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => {
                  onAddTags(message.data!.tags!);
                  hapticImpact('medium');
                }}
              >
                <Tag className="w-3 h-3 mr-1" />
                Применить теги
              </Button>
            )}
          </div>
        )}

        {/* Quick actions from AI */}
        {message.data?.quickActions && message.data.quickActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.data.quickActions.slice(0, 4).map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleQuickAction(action.action)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Lyrics Agent</h2>
            {projectContext && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {projectContext.projectTitle} • {trackContext?.title || 'Новый трек'}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Workflow progress */}
      <div className="px-4 py-2 border-b border-border/30 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.step}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all",
                currentWorkflowStep >= step.step
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted/30 text-muted-foreground"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                currentWorkflowStep >= step.step ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {step.step}
              </span>
              <span className="font-medium">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick tools bar */}
      <div className="px-2 py-2 border-b border-border/30 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {QUICK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-3 gap-1.5 shrink-0",
                  isActive && "bg-primary"
                )}
                onClick={() => handleToolSelect(tool.id)}
                disabled={isLoading}
              >
                <Icon className={cn("w-3.5 h-3.5", !isActive && tool.color)} />
                <span className="text-xs">{tool.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tool panel */}
      <AnimatePresence mode="wait">{renderToolPanel()}</AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-3">
          {/* Context indicator */}
          {(projectContext || existingLyrics) && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-muted/50 border border-border/30"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">Контекст:</p>
              <div className="flex flex-wrap gap-1.5">
                {projectContext?.genre && (
                  <Badge variant="secondary" className="text-xs">🎵 {projectContext.genre}</Badge>
                )}
                {projectContext?.mood && (
                  <Badge variant="secondary" className="text-xs">💫 {projectContext.mood}</Badge>
                )}
                {existingLyrics && (
                  <Badge variant="secondary" className="text-xs">📝 Есть текст</Badge>
                )}
                {trackContext && (
                  <Badge variant="secondary" className="text-xs">🎤 Трек #{trackContext.position}</Badge>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick start actions */}
          {showQuickActions && messages.length <= 1 && (
            <QuickActionsBar
              hasLyrics={!!existingLyrics}
              genre={genre || projectContext?.genre}
              mood={mood || projectContext?.mood}
              onAction={handleQuickAction}
            />
          )}

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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2.5",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/80 rounded-bl-sm border border-border/50"
                )}>
                  {renderMessage(message)}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/50 p-3 shrink-0 bg-background">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 shrink-0" 
            onClick={clearMessages}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
          
          {/* Voice input button */}
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className={cn("h-10 w-10 shrink-0 relative", isRecording && "animate-pulse")}
            onClick={toggleRecording}
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              </>
            ) : (
              <Mic className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              placeholder={isRecording ? "Говорите..." : "Опишите задачу или задайте вопрос..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[40px] max-h-[100px] resize-none text-sm",
                isRecording && "border-red-500/50 bg-red-500/5"
              )}
              rows={1}
            />
          </div>
          <Button 
            size="icon" 
            className="h-10 w-10 shrink-0" 
            onClick={handleSend} 
            disabled={isLoading || !input.trim() || isRecording}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
