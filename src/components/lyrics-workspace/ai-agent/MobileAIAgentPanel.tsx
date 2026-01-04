/**
 * MobileAIAgentPanel - Minimalist mobile AI agent for lyrics
 * Redesigned with smart toolbar, workflow engine, and clean UX
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Send, Loader2, Bot, User, Trash2, X, Sparkles,
  Tag, Mic, MicOff
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
import { useWorkflowEngine } from './hooks/useWorkflowEngine';
import { 
  WriteToolPanel, AnalyzeToolPanel, ProducerToolPanel, OptimizeToolPanel, RhymeToolPanel, TagsToolPanel,
  ContinueToolPanel, StructureToolPanel, RhythmToolPanel,
  StyleConvertToolPanel, ParaphraseToolPanel, HookGeneratorToolPanel, VocalMapToolPanel, TranslateToolPanel,
  DrillBuilderToolPanel, EpicBuilderToolPanel, ValidateSunoV5ToolPanel
} from './tools';
import { 
  HookResultCard, VocalMapResultCard, ParaphraseResultCard, TranslateResultCard 
} from './results';
import { StructuredLyricsDisplay } from './results/StructuredLyricsDisplay';
import { AIProgressIndicator } from './AIProgressIndicator';
import { SmartToolbar } from './SmartToolbar';
import { WorkflowProgress } from './WorkflowProgress';
import { AnalysisDashboard } from './AnalysisDashboard';
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

  // Workflow engine
  const {
    workflow: activeWorkflow,
    currentStep,
    currentStepIndex,
    stepResults,
    status: workflowStatus,
    progress: workflowProgress,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    skipStep,
    cancelWorkflow,
    isRunning: isWorkflowRunning,
  } = useWorkflowEngine({
    context,
    executeTool,
    onWorkflowComplete: () => hapticImpact('medium'),
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

  const latestLyrics = useMemo(() => {
    const lyricsMessages = messages.filter(m => m.role === 'assistant' && m.data?.lyrics);
    return lyricsMessages.length > 0 ? lyricsMessages[lyricsMessages.length - 1].data?.lyrics : null;
  }, [messages]);

  // Telegram main button
  useTelegramMainButton({
    text: 'ПРИМЕНИТЬ ЛИРИКУ',
    onClick: () => {
      if (latestLyrics) {
        onReplaceLyrics?.(latestLyrics);
        hapticImpact('medium');
        onClose();
      }
    },
    visible: hasGeneratedLyrics && isOpen && !isLoading && !isWorkflowRunning,
    color: '#22c55e',
    textColor: '#ffffff',
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

  const handleToolExecute = useCallback((toolId: AIToolId, input: Record<string, unknown>) => {
    setOpenToolPanel(null);
    executeTool(toolId, input);
  }, [executeTool]);

  const handleStartWorkflow = useCallback((workflowId: string) => {
    hapticImpact('medium');
    startWorkflow(workflowId);
  }, [startWorkflow]);

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
      case 'continue': return <ContinueToolPanel {...panelProps} />;
      case 'structure': return <StructureToolPanel {...panelProps} />;
      case 'rhythm': return <RhythmToolPanel {...panelProps} />;
      case 'style_convert': return <StyleConvertToolPanel {...panelProps} />;
      case 'paraphrase': return <ParaphraseToolPanel {...panelProps} />;
      case 'hook_generator': return <HookGeneratorToolPanel {...panelProps} />;
      case 'vocal_map': return <VocalMapToolPanel {...panelProps} />;
      case 'translate': return <TranslateToolPanel {...panelProps} />;
      case 'drill_builder': return <DrillBuilderToolPanel {...panelProps} />;
      case 'epic_builder': return <EpicBuilderToolPanel {...panelProps} />;
      case 'validate_v5': return <ValidateSunoV5ToolPanel {...panelProps} />;
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

    // Check for analysis data to render dashboard
    const hasAnalysis = message.data?.fullAnalysis || message.data?.producerReview || message.type === 'full_analysis';

    return (
      <>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        {/* Analysis Dashboard for analysis results */}
        {hasAnalysis && (
          <AnalysisDashboard
            qualityScore={message.data?.fullAnalysis?.overallScore || message.data?.producerReview?.overallScore || 0}
            rhymeScheme={message.data?.fullAnalysis?.rhymes?.scheme}
            recommendations={
              message.data?.fullAnalysis?.recommendations?.map(r => r.text) || 
              message.data?.producerReview?.recommendations?.map(r => r.text) ||
              message.data?.producerReview?.weaknesses
            }
          />
        )}
        
        {/* Structured lyrics display */}
        {message.data?.lyrics && !hasAnalysis && (
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

        {/* Hooks result */}
        {message.data?.hooks && (
          <HookResultCard 
            data={message.data.hooks}
            onApplyHook={(hook) => onInsertLyrics?.(hook)}
          />
        )}

        {/* Vocal map result */}
        {message.data?.vocalMap && (
          <VocalMapResultCard sections={message.data.vocalMap} />
        )}

        {/* Paraphrase variants result */}
        {message.data?.paraphraseVariants && (
          <ParaphraseResultCard 
            variants={message.data.paraphraseVariants}
            onApplyVariant={(text: string) => onReplaceLyrics?.(text)}
          />
        )}

        {/* Translation result */}
        {message.data?.translation && (
          <TranslateResultCard 
            translatedLyrics={message.data.translation.translatedLyrics}
            sourceLanguage={message.data.translation.sourceLanguage}
            targetLanguage={message.data.translation.targetLanguage}
            adaptationNotes={message.data.translation.adaptationNotes}
            syllablePreserved={message.data.translation.syllablePreserved}
            onApply={(text: string) => onReplaceLyrics?.(text)}
          />
        )}

        {/* Quick actions from AI */}
        {message.data?.quickActions && message.data.quickActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.data.quickActions.slice(0, 3).map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => sendChatMessage(action.action)}
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
      className="fixed inset-0 z-[100] bg-background flex flex-col"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">AI Lyrics</span>
            {existingLyrics && (
              <span className="text-xs text-muted-foreground">
                {existingLyrics.length} симв
              </span>
            )}
            {(genre || projectContext?.genre) && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {genre || projectContext?.genre}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Smart Toolbar - 4 main buttons */}
      <SmartToolbar
        activeTool={activeTool}
        onSelectTool={handleToolSelect}
        onStartWorkflow={handleStartWorkflow}
        isLoading={isLoading || isWorkflowRunning}
        hasLyrics={!!existingLyrics}
      />

      {/* Tool panel */}
      <AnimatePresence mode="wait">{renderToolPanel()}</AnimatePresence>

      {/* Workflow progress */}
      <AnimatePresence>
        {activeWorkflow && (
          <WorkflowProgress
            workflow={activeWorkflow}
            currentStepIndex={currentStepIndex}
            stepResults={stepResults}
            status={workflowStatus}
            progress={workflowProgress}
            onPause={pauseWorkflow}
            onResume={resumeWorkflow}
            onSkip={skipStep}
            onCancel={cancelWorkflow}
          />
        )}
      </AnimatePresence>

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
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/60 rounded-bl-sm border border-border/30"
                )}>
                  {renderMessage(message)}
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

      {/* Input area */}
      <div className="border-t border-border/30 p-3 shrink-0 bg-background">
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
          
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className={cn("h-10 w-10 shrink-0", isRecording && "animate-pulse")}
            onClick={toggleRecording}
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="min-h-10 max-h-24 resize-none rounded-xl text-sm"
            rows={1}
          />
          
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
