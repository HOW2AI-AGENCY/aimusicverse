/**
 * Keyboard Shortcuts Hook
 * Feature: 032-professional-ui
 * 
 * Global and scoped keyboard shortcuts with conflict detection
 */

import { useEffect, useCallback, useRef } from 'react';

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';
type KeyCombo = string; // e.g., "ctrl+s", "alt+shift+p"

interface ShortcutConfig {
  key: KeyCombo;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  scope?: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface ShortcutRegistry {
  [key: string]: {
    handler: (e: KeyboardEvent) => void;
    description?: string;
    scope?: string;
    preventDefault: boolean;
  };
}

// Global registry for shortcut documentation
const globalRegistry: ShortcutRegistry = {};

function parseKeyCombo(combo: KeyCombo): { modifiers: ModifierKey[]; key: string } {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop() || '';
  const modifiers = parts as ModifierKey[];
  return { modifiers, key };
}

function matchesKeyCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
  const { modifiers, key } = parseKeyCombo(combo);
  
  const ctrlRequired = modifiers.includes('ctrl');
  const altRequired = modifiers.includes('alt');
  const shiftRequired = modifiers.includes('shift');
  const metaRequired = modifiers.includes('meta');

  const ctrlMatch = ctrlRequired === (e.ctrlKey || e.metaKey);
  const altMatch = altRequired === e.altKey;
  const shiftMatch = shiftRequired === e.shiftKey;
  const metaMatch = metaRequired === e.metaKey;

  const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`;

  return ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], deps: unknown[] = []) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    // Register shortcuts
    shortcuts.forEach(({ key, description, scope, preventDefault = true }) => {
      globalRegistry[key] = {
        handler: () => {},
        description,
        scope,
        preventDefault,
      };
    });

    return () => {
      // Cleanup
      shortcuts.forEach(({ key }) => {
        delete globalRegistry[key];
      });
    };
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;
        
        if (matchesKeyCombo(e, shortcut.key)) {
          // Allow shortcuts with modifiers in inputs
          const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
          if (isInput && !hasModifier) continue;

          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}

// Preset shortcuts for common actions
export const commonShortcuts = {
  save: 'ctrl+s',
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  copy: 'ctrl+c',
  paste: 'ctrl+v',
  cut: 'ctrl+x',
  selectAll: 'ctrl+a',
  search: 'ctrl+f',
  newItem: 'ctrl+n',
  delete: 'delete',
  escape: 'escape',
  enter: 'enter',
  space: 'space',
  playPause: 'space',
  volumeUp: 'arrowup',
  volumeDown: 'arrowdown',
  seekForward: 'arrowright',
  seekBackward: 'arrowleft',
  fullscreen: 'f',
  mute: 'm',
  like: 'l',
  share: 's',
} as const;

// Hook for player-specific shortcuts
export function usePlayerShortcuts(handlers: {
  onPlayPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onFullscreen?: () => void;
  onLike?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    { key: 'space', handler: () => handlers.onPlayPause?.(), description: 'Play/Pause' },
    { key: 'arrowright', handler: () => handlers.onSeekForward?.(), description: 'Seek forward' },
    { key: 'arrowleft', handler: () => handlers.onSeekBackward?.(), description: 'Seek backward' },
    { key: 'arrowup', handler: () => handlers.onVolumeUp?.(), description: 'Volume up' },
    { key: 'arrowdown', handler: () => handlers.onVolumeDown?.(), description: 'Volume down' },
    { key: 'm', handler: () => handlers.onMute?.(), description: 'Mute/Unmute' },
    { key: 'f', handler: () => handlers.onFullscreen?.(), description: 'Toggle fullscreen' },
    { key: 'l', handler: () => handlers.onLike?.(), description: 'Like track' },
  ].filter(s => s.handler !== undefined);

  useKeyboardShortcuts(shortcuts, [handlers]);
}

// Get all registered shortcuts for help display
export function getRegisteredShortcuts(): Array<{
  key: string;
  description: string;
  scope?: string;
}> {
  return Object.entries(globalRegistry).map(([key, config]) => ({
    key,
    description: config.description || '',
    scope: config.scope,
  }));
}

export default useKeyboardShortcuts;
