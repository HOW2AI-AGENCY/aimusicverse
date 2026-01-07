/**
 * useKeyboardShortcuts - Studio keyboard shortcuts
 * 
 * Provides professional DAW-like keyboard controls:
 * - Space: Play/Pause
 * - M: Mute selected track
 * - S: Solo selected track
 * - Arrow keys: Navigation
 * - Number keys: Select track by index
 */

import { useEffect, useCallback, useRef } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface KeyboardShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'playback' | 'track' | 'navigation' | 'edit';
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onPlayPause?: () => void;
  onStop?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onMuteSelected?: () => void;
  onSoloSelected?: () => void;
  onSelectTrack?: (index: number) => void;
  onSelectNext?: () => void;
  onSelectPrevious?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    onPlayPause,
    onStop,
    onSeekForward,
    onSeekBackward,
    onMuteSelected,
    onSoloSelected,
    onSelectTrack,
    onSelectNext,
    onSelectPrevious,
    onUndo,
    onRedo,
    onSave,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  } = options;

  const haptic = useHapticFeedback();
  const isInputFocusedRef = useRef(false);

  // Build shortcuts map
  const shortcuts = useCallback((): KeyboardShortcutAction[] => {
    const actions: KeyboardShortcutAction[] = [];

    if (onPlayPause) {
      actions.push({
        key: ' ',
        action: onPlayPause,
        description: 'Play/Pause',
        category: 'playback',
      });
    }

    if (onStop) {
      actions.push({
        key: 'Escape',
        action: onStop,
        description: 'Stop',
        category: 'playback',
      });
    }

    if (onSeekForward) {
      actions.push({
        key: 'ArrowRight',
        action: onSeekForward,
        description: 'Seek forward',
        category: 'playback',
      });
    }

    if (onSeekBackward) {
      actions.push({
        key: 'ArrowLeft',
        action: onSeekBackward,
        description: 'Seek backward',
        category: 'playback',
      });
    }

    if (onMuteSelected) {
      actions.push({
        key: 'm',
        action: onMuteSelected,
        description: 'Mute selected track',
        category: 'track',
      });
    }

    if (onSoloSelected) {
      actions.push({
        key: 's',
        action: onSoloSelected,
        description: 'Solo selected track',
        category: 'track',
      });
    }

    if (onSelectNext) {
      actions.push({
        key: 'ArrowDown',
        action: onSelectNext,
        description: 'Select next track',
        category: 'navigation',
      });
    }

    if (onSelectPrevious) {
      actions.push({
        key: 'ArrowUp',
        action: onSelectPrevious,
        description: 'Select previous track',
        category: 'navigation',
      });
    }

    if (onUndo) {
      actions.push({
        key: 'z',
        ctrl: true,
        action: onUndo,
        description: 'Undo',
        category: 'edit',
      });
    }

    if (onRedo) {
      actions.push({
        key: 'z',
        ctrl: true,
        shift: true,
        action: onRedo,
        description: 'Redo',
        category: 'edit',
      });
      actions.push({
        key: 'y',
        ctrl: true,
        action: onRedo,
        description: 'Redo',
        category: 'edit',
      });
    }

    if (onSave) {
      actions.push({
        key: 's',
        ctrl: true,
        action: onSave,
        description: 'Save',
        category: 'edit',
      });
    }

    if (onZoomIn) {
      actions.push({
        key: '=',
        ctrl: true,
        action: onZoomIn,
        description: 'Zoom in',
        category: 'navigation',
      });
    }

    if (onZoomOut) {
      actions.push({
        key: '-',
        ctrl: true,
        action: onZoomOut,
        description: 'Zoom out',
        category: 'navigation',
      });
    }

    if (onResetZoom) {
      actions.push({
        key: '0',
        ctrl: true,
        action: onResetZoom,
        description: 'Reset zoom',
        category: 'navigation',
      });
    }

    // Number keys for track selection (1-9)
    if (onSelectTrack) {
      for (let i = 1; i <= 9; i++) {
        actions.push({
          key: String(i),
          action: () => onSelectTrack(i - 1),
          description: `Select track ${i}`,
          category: 'navigation',
        });
      }
    }

    return actions;
  }, [
    onPlayPause,
    onStop,
    onSeekForward,
    onSeekBackward,
    onMuteSelected,
    onSoloSelected,
    onSelectTrack,
    onSelectNext,
    onSelectPrevious,
    onUndo,
    onRedo,
    onSave,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  ]);

  // Handle keydown
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const shortcutList = shortcuts();
      
      for (const shortcut of shortcutList) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || 
                         e.key === shortcut.key;
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          haptic.tap();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcuts, haptic]);

  // Get all shortcuts for help display
  const getShortcutsList = useCallback(() => {
    return shortcuts().map(({ key, ctrl, shift, alt, description, category }) => ({
      keys: [
        ctrl && (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'),
        shift && 'Shift',
        alt && 'Alt',
        key === ' ' ? 'Space' : key,
      ].filter(Boolean).join(' + '),
      description,
      category,
    }));
  }, [shortcuts]);

  return {
    getShortcutsList,
  };
}

// Preset for common studio shortcuts
export function useStudioKeyboardShortcuts(
  controls: {
    toggle: () => void;
    seek: (time: number) => void;
    getCurrentTime: () => number;
  },
  trackControls?: {
    selectedTrackId: string | null;
    onToggleMute: (id: string) => void;
    onToggleSolo: (id: string) => void;
    tracks: { id: string }[];
    onSelectTrack: (id: string) => void;
  }
) {
  return useKeyboardShortcuts({
    onPlayPause: controls.toggle,
    onSeekForward: () => controls.seek(controls.getCurrentTime() + 5),
    onSeekBackward: () => controls.seek(Math.max(0, controls.getCurrentTime() - 5)),
    onMuteSelected: trackControls?.selectedTrackId
      ? () => trackControls.onToggleMute(trackControls.selectedTrackId!)
      : undefined,
    onSoloSelected: trackControls?.selectedTrackId
      ? () => trackControls.onToggleSolo(trackControls.selectedTrackId!)
      : undefined,
    onSelectTrack: trackControls
      ? (index) => {
          const track = trackControls.tracks[index];
          if (track) trackControls.onSelectTrack(track.id);
        }
      : undefined,
    onSelectNext: trackControls
      ? () => {
          const currentIndex = trackControls.tracks.findIndex(
            (t) => t.id === trackControls.selectedTrackId
          );
          const nextTrack = trackControls.tracks[currentIndex + 1];
          if (nextTrack) trackControls.onSelectTrack(nextTrack.id);
        }
      : undefined,
    onSelectPrevious: trackControls
      ? () => {
          const currentIndex = trackControls.tracks.findIndex(
            (t) => t.id === trackControls.selectedTrackId
          );
          const prevTrack = trackControls.tracks[currentIndex - 1];
          if (prevTrack) trackControls.onSelectTrack(prevTrack.id);
        }
      : undefined,
  });
}
