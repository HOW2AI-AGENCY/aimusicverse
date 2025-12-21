/**
 * EditableTitle - Reusable inline title editor
 * Click to edit, supports keyboard navigation (Enter to save, Escape to cancel)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  disabled?: boolean;
  showEditIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EditableTitle({
  value,
  onChange,
  placeholder = 'Введите название',
  className,
  inputClassName,
  maxLength = 200,
  disabled = false,
  showEditIcon = true,
  size = 'md',
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setEditValue(value); // Reset to original
    }
    setIsEditing(false);
  }, [editValue, value, onChange]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
    }
  }, [disabled]);

  const sizeClasses = {
    sm: 'text-sm h-7',
    md: 'text-base h-8',
    lg: 'text-lg h-9',
  };

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
  };

  return (
    <div className={cn('relative min-w-0', className)}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
          >
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                'flex-1 font-semibold border-primary/50 focus-visible:ring-primary/30',
                sizeClasses[size],
                inputClassName
              )}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-green-500 hover:bg-green-500/10 flex-shrink-0"
              onClick={handleSave}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before save
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={handleCancel}
              onMouseDown={(e) => e.preventDefault()}
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'flex items-center gap-1.5 cursor-pointer group',
              disabled && 'cursor-default'
            )}
            onClick={handleClick}
          >
            <h2 className={cn(
              'font-bold truncate',
              titleSizeClasses[size],
              !disabled && 'group-hover:text-primary transition-colors'
            )}>
              {value || placeholder}
            </h2>
            {showEditIcon && !disabled && (
              <PenLine className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
