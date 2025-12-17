/**
 * EditablePromptPreview - Editable prompt display with tags
 * Shows current prompt with ability to edit directly
 */

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Check, X, Copy, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditablePromptPreviewProps {
  prompt: string;
  onPromptChange?: (newPrompt: string) => void;
  isGenerating?: boolean;
  className?: string;
}

export const EditablePromptPreview = memo(function EditablePromptPreview({
  prompt,
  onPromptChange,
  isGenerating,
  className,
}: EditablePromptPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(prompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit value when prompt changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(prompt);
    }
  }, [prompt, isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditValue(prompt);
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [prompt]);

  const handleSave = useCallback(() => {
    if (onPromptChange && editValue.trim() !== prompt) {
      onPromptChange(editValue.trim());
      toast.success('Промпт обновлён');
    }
    setIsEditing(false);
  }, [editValue, prompt, onPromptChange]);

  const handleCancel = useCallback(() => {
    setEditValue(prompt);
    setIsEditing(false);
  }, [prompt]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt);
    toast.success('Скопировано');
  }, [prompt]);

  // Extract tags from prompt for display
  const tags = prompt
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length < 30)
    .slice(0, 6);

  return (
    <div className={cn('rounded-xl bg-black/20 backdrop-blur-sm overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3"
          >
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[80px] text-sm bg-transparent border-primary/30 focus:border-primary resize-none"
              placeholder="Опишите желаемую музыку..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={handleCancel}
              >
                <X className="w-3 h-3 mr-1" />
                Отмена
              </Button>
              <Button 
                size="sm" 
                className="h-7 px-3"
                onClick={handleSave}
              >
                <Check className="w-3 h-3 mr-1" />
                Сохранить
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3"
          >
            {/* Header with actions */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Промпт
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                  disabled={!prompt}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleStartEdit}
                  disabled={isGenerating}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Prompt text */}
            <p className={cn(
              'text-xs font-medium line-clamp-2 min-h-[2rem] cursor-pointer',
              !prompt && 'text-muted-foreground italic'
            )}
            onClick={handleStartEdit}
            >
              {prompt || 'Вращайте ручки чтобы создать промпт...'}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 text-[9px] rounded-full bg-primary/10 text-primary/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
