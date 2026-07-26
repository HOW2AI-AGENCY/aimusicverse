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
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [isEditing, autoResize]);

  const handleSave = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  // Debounced blur — on mobile Telegram WebView the keyboard dismissal
  // can fire blur immediately after focus; the delay gives the user time
  // to interact with the textarea (e.g. paste via keyboard) before it
  // closes.  Also clear any pending blur when the textarea regains focus.
  const handleBlurDebounced = useCallback(() => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => handleSave(), 350);
  }, [handleSave]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData?.getData("text/plain");
    if (pasted) {
      e.preventDefault();
      setEditValue(pasted);
      // Clear any pending blur timer so the paste takes effect.
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    }
  }, []);

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
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlurDebounced}
          onPaste={handlePaste}
          onFocus={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "text-sm resize-none overflow-hidden border-primary/50 focus-visible:ring-primary/30",
            "min-h-[2.5rem] pr-10",
            className,
          )}
          style={{ height: "auto" }}
        />
        <button
          type="button"
          onClick={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            handleSave();
          }}
          className="absolute right-1.5 top-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Готово
        </button>
      </div>
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
