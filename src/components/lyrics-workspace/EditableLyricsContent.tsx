/**
 * EditableLyricsContent - Inline editable lyrics text
 * Shows plain text by default, switches to textarea on click
 * Auto-adjusts height to content
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EditableLyricsContentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditableLyricsContent({
  value,
  onChange,
  placeholder = "Введите текст секции...",
  className,
}: EditableLyricsContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Declare autoResize BEFORE the effect that uses it (fixes TDZ / immutability
  // warning and the resulting preserve-manual-memoization skip).
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Sync editValue with the external value when NOT editing. Uses the
  // render-time setState escape hatch (ref-guarded) instead of an effect to
  // avoid a cascading render (set-state-in-effect rule).
  const prevIsEditingRef = useRef(isEditing);
  const prevValueRef = useRef(value);
  if ((!isEditing || prevIsEditingRef.current) && prevValueRef.current !== value) {
    prevValueRef.current = value;
    if (!isEditing) {
      setEditValue(value);
    }
  }
  prevIsEditingRef.current = isEditing;

  // Focus and auto-resize when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
      autoResize();
    }
  }, [isEditing, autoResize]);

  const handleSave = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [value],
  );

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
      autoResize();
    },
    [autoResize],
  );

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "text-sm resize-none overflow-hidden border-primary/50 focus-visible:ring-primary/30",
          "min-h-[2.5rem]",
          className,
        )}
        style={{ height: "auto" }}
      />
    );
  }

  // Display mode - show text directly on card
  return (
    <div
      onClick={handleClick}
      className={cn(
        "text-sm cursor-text rounded-md transition-colors min-h-[2.5rem]",
        "hover:bg-muted/50 px-1 py-0.5 -mx-1",
        "whitespace-pre-wrap break-words",
        !value && "text-muted-foreground italic",
        className,
      )}
    >
      {value || placeholder}
    </div>
  );
}
