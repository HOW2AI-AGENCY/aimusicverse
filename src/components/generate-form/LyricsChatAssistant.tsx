import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
}: LyricsChatAssistantProps) {
  const isMobile = useIsMobile();
  
  const chat = useLyricsChat({
    open,
    initialGenre,
    initialMood,
    initialLanguage,
    onLyricsGenerated,
    onStyleGenerated,
    onClose: () => onOpenChange(false),
  });

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
            lyrics={msg.data?.lyrics || chat.generatedLyrics}
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

  const chatContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Area */}
      <ScrollArea className="flex-1 min-h-0 px-4 py-3" ref={chat.scrollRef}>
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
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  
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

      {/* Input Area */}
      <div className="p-4 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-sm safe-area-bottom">
        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Input
            value={chat.inputValue}
            onChange={(e) => chat.setInputValue(e.target.value)}
            placeholder={chat.generatedLyrics ? 'Что изменить...' : 'Напишите тему песни...'}
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
              AI Помощник
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
            AI Lyrics Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {chatContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
