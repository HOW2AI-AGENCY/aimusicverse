import { memo, useRef, useEffect, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Send, Sparkles, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onQuickActionToggle?: () => void;
  isLoading?: boolean;
  showQuickActions?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ChatInputArea = memo(({
  value,
  onChange,
  onSend,
  onQuickActionToggle,
  isLoading = false,
  showQuickActions = false,
  placeholder = 'Напишите о чём песня...',
  disabled = false,
  className,
}: ChatInputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!disabled && !isLoading && value.trim()) {
        onSend();
      }
      return;
    }
    
    // Enter without shift to send (single line mode)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && value.trim()) {
        onSend();
      }
    }
  }, [disabled, isLoading, value, onSend]);

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn(
      'border-t border-border/50 bg-background/80 backdrop-blur-sm p-3',
      className
    )}>
      <div className="flex items-end gap-2">
        {/* Quick actions toggle */}
        {onQuickActionToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0 rounded-xl transition-colors',
              showQuickActions && 'bg-primary/10 text-primary'
            )}
            onClick={onQuickActionToggle}
            disabled={disabled}
          >
            {showQuickActions ? (
              <X className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Input area */}
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[120px] resize-none pr-12 py-3',
              'rounded-xl border-border/50 bg-muted/30',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
              'placeholder:text-muted-foreground/60',
              'transition-all duration-200'
            )}
          />
          
          {/* Character count hint */}
          {value.length > 100 && (
            <span className="absolute right-14 bottom-3 text-[10px] text-muted-foreground">
              {value.length}/500
            </span>
          )}
        </div>

        {/* Send button */}
        <motion.div
          initial={false}
          animate={{ 
            scale: canSend ? 1 : 0.9,
            opacity: canSend ? 1 : 0.5 
          }}
        >
          <Button
            type="button"
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0 rounded-xl transition-all',
              canSend 
                ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20' 
                : 'bg-muted'
            )}
            onClick={onSend}
            disabled={!canSend}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Enter</kbd> отправить
          <span className="mx-1.5">•</span>
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Shift+Enter</kbd> новая строка
        </p>
      </div>
    </div>
  );
});

ChatInputArea.displayName = 'ChatInputArea';
