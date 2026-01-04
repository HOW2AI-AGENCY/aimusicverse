import { memo, forwardRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import type { ChatMessage, QuickOption } from './types';
import { LoadingIndicator, ChatMessageBubble } from './ChatMessageBubble';
import { GenrePicker } from '@/components/lyrics/shared/GenrePicker';
import { MoodPicker } from '@/components/lyrics/shared/MoodPicker';
import { StructurePicker } from '@/components/lyrics/shared/StructurePicker';
import { EnhancedLyricsPreview } from './EnhancedLyricsPreview';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedGenre: string;
  selectedMoods: string[];
  selectedStructure: string;
  copied: boolean;
  saved: boolean;
  isSaving: boolean;
  generatedLyrics: string;
  showApplyButton?: boolean;
  onGenreSelect: (genre: string) => void;
  onMoodSelect: (moods: string[]) => void;
  onMoodConfirm: () => void;
  onStructureSelect: (structure: string) => void;
  onOptionClick: (option: QuickOption) => void;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  onApply: () => void;
  onContinue: () => void;
  onRequestEdit?: (instruction: string) => void;
  onTitleChange?: (title: string) => void;
  onStyleChange?: (style: string) => void;
}

export const ChatMessageList = memo(forwardRef<HTMLDivElement, ChatMessageListProps>(({
  messages,
  isLoading,
  selectedGenre,
  selectedMoods,
  selectedStructure,
  copied,
  saved,
  isSaving,
  generatedLyrics,
  showApplyButton = true,
  onGenreSelect,
  onMoodSelect,
  onMoodConfirm,
  onStructureSelect,
  onOptionClick,
  onCopy,
  onSave,
  onRegenerate,
  onApply,
  onContinue,
  onRequestEdit,
  onTitleChange,
  onStyleChange,
}, ref) => {
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth overscroll-contain"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 30,
              mass: 0.8
            }}
            layout
          >
            <ChatMessageBubble
              message={message}
              onOptionClick={onOptionClick}
            />
            
            {/* Component renderers */}
            {message.component === 'genre' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 ml-2"
              >
                <GenrePicker
                  value={selectedGenre}
                  onChange={onGenreSelect}
                  mode="grid"
                  className="max-w-sm"
                />
              </motion.div>
            )}
            
            {message.component === 'mood' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 ml-2"
              >
                <MoodPicker
                  value={selectedMoods}
                  onChange={onMoodSelect}
                  onConfirm={onMoodConfirm}
                  maxSelections={3}
                  className="max-w-md"
                />
              </motion.div>
            )}
            
            {message.component === 'structure' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 ml-2"
              >
                <StructurePicker
                  value={selectedStructure}
                  onChange={onStructureSelect}
                  className="max-w-sm"
                />
              </motion.div>
            )}
            
            {message.component === 'lyrics-preview' && message.data && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <EnhancedLyricsPreview
                  lyrics={(message.data.lyrics as string) || generatedLyrics}
                  title={message.data.title as string | undefined}
                  style={message.data.style as string | undefined}
                  copied={copied}
                  saved={saved}
                  isSaving={isSaving}
                  isLoading={isLoading}
                  onCopy={onCopy}
                  onSave={onSave}
                  onRegenerate={onRegenerate}
                  onApply={onApply}
                  onContinue={onContinue}
                  onRequestEdit={onRequestEdit}
                  onTitleChange={onTitleChange}
                  onStyleChange={onStyleChange}
                  showApplyButton={showApplyButton}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
        
        {isLoading && <LoadingIndicator key="loading" />}
      </AnimatePresence>
    </div>
  );
}));

ChatMessageList.displayName = 'ChatMessageList';
