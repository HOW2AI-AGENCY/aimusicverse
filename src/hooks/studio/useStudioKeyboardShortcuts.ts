/**
 * Studio Keyboard Shortcuts Hook
 * 
 * Centralized keyboard shortcut management for Stem Studio
 * Provides customizable shortcuts with proper cleanup
 */

import { useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface KeyboardShortcut {
  key: string;
  code?: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseStudioKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  excludeInputs?: boolean;
}

export function useStudioKeyboardShortcuts({
  shortcuts,
  enabled = true,
  excludeInputs = true,
}: UseStudioKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in input/textarea
    if (excludeInputs && (
      event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement
    )) {
      return;
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.code ? event.code === s.code : event.key === s.key;
      const ctrlMatch = s.ctrl === undefined || s.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = s.shift === undefined || s.shift === event.shiftKey;
      const altMatch = s.alt === undefined || s.alt === event.altKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (shortcut) {
      event.preventDefault();
      logger.debug(`Keyboard shortcut triggered: ${shortcut.description}`);
      shortcut.action();
    }
  }, [enabled, excludeInputs, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
  };
}

/**
 * Get formatted shortcut string for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const keys: string[] = [];
  
  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.shift) keys.push('Shift');
  if (shortcut.alt) keys.push('Alt');
  keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  
  return keys.join('+');
}
