import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/lib/lyrics/constants';
import type { ChatMessage, QuickOption } from './types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onOptionClick: (option: QuickOption) => void;
}

export const ChatMessageBubble = memo(({ message, onOptionClick }: ChatMessageBubbleProps) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={cn(
      'flex',
      isAssistant ? 'justify-start' : 'justify-end'
    )}>
      <div
        className={cn(
          'max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3',
          isAssistant 
            ? 'bg-muted rounded-bl-md' 
            : 'bg-primary text-primary-foreground rounded-br-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        
        {/* Quick options */}
        {message.options && message.options.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.options.map((opt, idx) => (
              <motion.button
                key={`${opt.value}-${idx}`}
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  'bg-background/80 hover:bg-background text-foreground shadow-sm',
                  'border border-border/50 hover:border-primary/30'
                )}
                onClick={() => onOptionClick(opt)}
              >
                {opt.icon && <span className="text-base">{opt.icon}</span>}
                <span>{opt.label}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessageBubble.displayName = 'ChatMessageBubble';

/**
 * LoadingIndicator - Displays an animated loading state during AI processing
 */
export const LoadingIndicator = memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start"
    >
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <motion.div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 bg-primary/60 rounded-full"
                animate={{ 
                  y: [0, -6, 0],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
          <span className="text-xs text-muted-foreground">Думаю...</span>
        </div>
      </div>
    </motion.div>
  );
});

LoadingIndicator.displayName = 'LoadingIndicator';

/**
 * SkeletonMessage - Placeholder for loading messages
 */
export const SkeletonMessage = memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 w-3/4">
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-full" />
          <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-3/5" />
        </div>
      </div>
    </motion.div>
  );
});

SkeletonMessage.displayName = 'SkeletonMessage';
