import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Send, MessageCircle, Tag, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLyricsChat } from './lyrics-chat/useLyricsChat';
import { 
  GenreSelector, 
  MoodSelector, 
  StructureSelector, 
  LyricsPreview,
  LoadingIndicator 
} from './lyrics-chat/ChatComponents';
import { TagBuilderPanel } from './TagBuilderPanel';
import { ContextRecommendations, Recommendation } from './lyrics-chat/ContextRecommendations';
import { messageVariants, buttonVariants } from './lyrics-chat/constants';
import type { LyricsChatAssistantProps, ChatMessage } from './lyrics-chat/types';

export type { LyricsChatAssistantProps } from './lyrics-chat/types';

export function LyricsChatAssistant({
  open,
  onOpenChange,
  onLyricsGenerated,
  onStyleGenerated,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
  projectContext,
  trackContext,
  initialMode = 'new',
}: LyricsChatAssistantProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'chat' | 'tags' | 'ai'>('chat');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  
  const chat = useLyricsChat({
    open,
    initialGenre,
    initialMood,
    initialLanguage,
    projectContext,
    trackContext,
    initialMode,
    onLyricsGenerated,
    onStyleGenerated,
    onClose: () => onOpenChange(false),
  });

  // Fetch recommendations on open when context is available
  useEffect(() => {
    if (open && (projectContext || trackContext)) {
      loadRecommendations();
    }
  }, [open, projectContext, trackContext]);

  const loadRecommendations = useCallback(async () => {
    setIsLoadingRecs(true);
    try {
      const recs = await chat.fetchContextRecommendations();
      if (recs && recs.length > 0) {
        setRecommendations(recs);
      }
    } finally {
      setIsLoadingRecs(false);
    }
  }, [chat.fetchContextRecommendations]);

  const handleRecommendationSelect = useCallback((rec: Recommendation) => {
    // Add to chat as user message and process
    if (rec.type === 'theme') {
      chat.setInputValue(rec.value);
      chat.handleSendMessage();
    } else if (rec.type === 'tag') {
      // Insert tag directly into lyrics if available
      if (chat.generatedLyrics) {
        const updatedLyrics = `[${rec.value}]\n${chat.generatedLyrics}`;
        onLyricsGenerated(updatedLyrics);
      } else {
        chat.setInputValue(`Добавь тег [${rec.value}] в текст`);
      }
    }
  }, [chat, onLyricsGenerated]);

  const handleTagsGenerated = useCallback((tags: string) => {
    if (chat.generatedLyrics) {
      // Insert at the beginning of lyrics
      const updatedLyrics = `${tags}\n\n${chat.generatedLyrics}`;
      onLyricsGenerated(updatedLyrics);
    } else {
      chat.setInputValue(`Создай текст с тегами: ${tags}`);
    }
    setActiveTab('chat');
  }, [chat, onLyricsGenerated]);

  const renderComponent = (msg: ChatMessage) => {
    switch (msg.component) {
      case 'genre':
        return (
          <GenreSelector 
            selectedGenre={chat.genre} 
            onSelect={chat.handleGenreSelect} 
          />
        );
      case 'mood':
        return (
          <MoodSelector 
            selectedMoods={chat.mood} 
            onSelect={chat.handleMoodSelect}
            onConfirm={chat.confirmMood}
          />
        );
      case 'structure':
        return (
          <StructureSelector 
            selectedStructure={chat.structure} 
            onSelect={chat.handleStructureSelect} 
          />
        );
      case 'lyrics-preview':
        return (
          <LyricsPreview
            lyrics={typeof msg.data?.lyrics === 'string' ? msg.data.lyrics : (chat.generatedLyrics || '')}
            copied={chat.copied}
            saved={chat.saved}
            isSaving={chat.isSaving}
            isLoading={chat.isLoading}
            onCopy={chat.handleCopy}
            onSave={chat.handleSaveToLibrary}
            onRegenerate={chat.regenerateLyrics}
            onApply={chat.applyLyrics}
            onContinue={chat.continueConversation}
          />
        );
      default:
        return null;
    }
  };

  // Get title based on context
  const getTitle = () => {
    if (trackContext?.title) {
      return `Лирика: ${trackContext.title}`;
    }
    if (projectContext?.projectTitle) {
      return `${projectContext.projectTitle}`;
    }
    return 'AI Lyrics Assistant';
  };

  const chatContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Tabs for Chat / Tags / AI */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="shrink-0 px-4 pt-2">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="chat" className="text-xs gap-1">
            <MessageCircle className="h-3 w-3" />
            Чат
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

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* Chat Area */}
            <ScrollArea className="h-full px-4 py-3" ref={chat.scrollRef}>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {chat.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <motion.div
                        className={cn(
                          'max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-2.5',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                        layout
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        {msg.options && msg.role === 'assistant' && (
                          <motion.div 
                            className="flex flex-wrap gap-2 mt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {msg.options.map((opt, index) => (
                              <motion.button
                                key={opt.value}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                className="px-3 py-1.5 bg-background/80 hover:bg-background rounded-full text-xs font-medium text-foreground transition-colors shadow-sm"
                                onClick={() => chat.handleQuickOption(opt)}
                              >
                                {opt.label}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                        
                        {msg.component && renderComponent(msg)}
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <AnimatePresence>
                  {chat.isLoading && <LoadingIndicator />}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </>
        )}

        {activeTab === 'tags' && (
          <ScrollArea className="h-full p-4">
            <TagBuilderPanel
              onTagsGenerated={handleTagsGenerated}
              genre={chat.genre || projectContext?.genre}
              mood={chat.mood[0] || projectContext?.mood}
            />
          </ScrollArea>
        )}

        {activeTab === 'ai' && (
          <ScrollArea className="h-full p-4">
            <ContextRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecs}
              onRefresh={loadRecommendations}
              onSelect={handleRecommendationSelect}
            />
            {!isLoadingRecs && recommendations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Рекомендации недоступны</p>
                <p className="text-xs mt-1">Добавьте контекст проекта для получения AI-рекомендаций</p>
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Input Area - Only show in chat tab */}
      {activeTab === 'chat' && (
        <div className="p-4 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-sm safe-area-bottom shrink-0">
          {/* Helper text - show only at start */}
          {!chat.generatedLyrics && chat.messages.length <= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-xs text-muted-foreground mb-2 bg-muted/30 rounded-lg p-2"
            >
              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
              <div className="space-y-0.5">
                <p className="font-medium">💡 Пишите свободно! AI понимает:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                  <li>Прямые запросы: "Создай песню о море"</li>
                  <li>С параметрами: "Грустная баллада про дождь"</li>
                  <li>Вопросы: "Что можно написать?"</li>
                </ul>
              </div>
            </motion.div>
          )}
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Input
              value={chat.inputValue}
              onChange={(e) => chat.setInputValue(e.target.value)}
              placeholder={
                chat.generatedLyrics
                  ? 'Например: "Сделай припев энергичнее"'
                  : 'Например: "Создай песню о любви" или "Рок-баллада про дорогу"'
              }
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && chat.handleSendMessage()}
              disabled={chat.isLoading}
              className="flex-1 bg-muted/50 border-border/50 focus:bg-background transition-colors rounded-xl"
            />
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                size="icon"
                onClick={chat.handleSendMessage}
                disabled={!chat.inputValue.trim() || chat.isLoading}
                className="rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh] flex flex-col">
          <DrawerHeader className="pb-2 border-b border-border/50 shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="truncate">{getTitle()}</span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            {chatContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="truncate">{getTitle()}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {chatContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
