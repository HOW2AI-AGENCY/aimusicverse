/**
 * EditableTrackTitle - Inline editable track title component
 * Click to activate edit mode, enter/blur to save
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

interface EditableTrackTitleProps {
  trackId: string;
  title: string;
  className?: string;
  onTitleChange?: (newTitle: string) => void;
}

export const EditableTrackTitle = memo(function EditableTrackTitle({
  trackId,
  title,
  className,
  onTitleChange,
}: EditableTrackTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      setEditValue(title);
      setIsEditing(false);
      return;
    }

    if (trimmedValue === title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ title: trimmedValue })
        .eq('id', trackId);

      if (error) throw error;

      onTitleChange?.(trimmedValue);
      toast.success('Название изменено');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Ошибка сохранения');
      setEditValue(title);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, title, trackId, onTitleChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(title);
      setIsEditing(false);
    }
  }, [handleSave, title]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isSaving}
        className={cn(
          "w-full bg-transparent border-b border-primary outline-none",
          "text-sm font-semibold leading-tight",
          "py-0.5 px-0",
          isSaving && "opacity-50",
          className
        )}
        aria-label="Редактировать название трека"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-1.5 text-left cursor-pointer",
        "hover:text-primary transition-colors",
        className
      )}
      title="Нажмите, чтобы изменить название"
    >
      <span className="text-sm font-semibold truncate leading-tight">
        {title || 'Без названия'}
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
    </button>
  );
});
