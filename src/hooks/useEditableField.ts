/**
 * useEditableField - Reusable hook for inline field editing
 * Manages editing state, value synchronization, and keyboard handling
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseEditableFieldOptions {
  initialValue: string;
  onSave: (value: string) => void | Promise<void>;
  validate?: (value: string) => boolean;
}

interface UseEditableFieldReturn {
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startEditing: () => void;
  cancelEditing: () => void;
  saveValue: () => void;
  setEditValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useEditableField({
  initialValue,
  onSave,
  validate = (v) => v.trim().length > 0,
}: UseEditableFieldOptions): UseEditableFieldReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(initialValue);
    }
  }, [initialValue, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const saveValue = useCallback(async () => {
    const trimmed = editValue.trim();
    if (validate(trimmed) && trimmed !== initialValue) {
      await onSave(trimmed);
    } else if (!validate(trimmed)) {
      setEditValue(initialValue); // Reset to original
    }
    setIsEditing(false);
  }, [editValue, initialValue, onSave, validate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveValue();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [saveValue, cancelEditing]);

  return {
    isEditing,
    editValue,
    inputRef,
    startEditing,
    cancelEditing,
    saveValue,
    setEditValue,
    handleKeyDown,
  };
}
