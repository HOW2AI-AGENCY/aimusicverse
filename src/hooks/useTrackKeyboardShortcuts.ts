/**
 * useTrackKeyboardShortcuts Hook
 * 
 * Provides keyboard shortcuts for track actions in Library and Player views.
 * Supports common operations like play/pause, like, add to queue, etc.
 * 
 * @author MusicVerse AI
 * @task T066 - Add keyboard shortcuts for track actions
 */

import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGlobalAudioPlayer } from '@/hooks/audio/useGlobalAudioPlayer';
import { Track } from '@/types/track';
// Hook uses callbacks passed from components instead of global context
// to avoid circular dependencies

export interface TrackShortcut {
  /** Keyboard key to trigger the action */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrlOrCmd?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Human-readable description */
  description: string;
  /** Action category */
  category: 'playback' | 'library' | 'queue' | 'other';
}

/**
 * Default track shortcuts configuration
 */
export const defaultTrackShortcuts: Record<string, TrackShortcut> = {
  // Playback
  play_pause: {
    key: ' ',
    description: 'Воспроизведение/Пауза',
    category: 'playback',
  },
  next_track: {
    key: 'n',
    description: 'Следующий трек',
    category: 'playback',
  },
  previous_track: {
    key: 'p',
    description: 'Предыдущий трек',
    category: 'playback',
  },
  seek_forward: {
    key: 'ArrowRight',
    description: 'Перемотка +10с',
    category: 'playback',
  },
  seek_backward: {
    key: 'ArrowLeft',
    description: 'Перемотка -10с',
    category: 'playback',
  },
  volume_up: {
    key: 'ArrowUp',
    description: 'Громкость +10%',
    category: 'playback',
  },
  volume_down: {
    key: 'ArrowDown',
    description: 'Громкость -10%',
    category: 'playback',
  },
  mute: {
    key: 'm',
    description: 'Заглушить/Включить звук',
    category: 'playback',
  },
  // Library actions
  like_track: {
    key: 'l',
    description: 'Лайк/Анлайк',
    category: 'library',
  },
  download_track: {
    key: 'd',
    ctrlOrCmd: true,
    description: 'Скачать трек',
    category: 'library',
  },
  // Queue actions
  add_to_queue: {
    key: 'q',
    description: 'Добавить в очередь',
    category: 'queue',
  },
  play_next: {
    key: 'q',
    shift: true,
    description: 'Воспроизвести следующим',
    category: 'queue',
  },
  // Other
  shuffle: {
    key: 's',
    description: 'Перемешать',
    category: 'other',
  },
  repeat: {
    key: 'r',
    description: 'Режим повтора',
    category: 'other',
  },
};

interface UseTrackKeyboardShortcutsOptions {
  /** Currently selected track for library actions */
  selectedTrack?: Track | null;
  /** Callback for play/pause */
  onPlayPause?: () => void;
  /** Callback for next track */
  onNext?: () => void;
  /** Callback for previous track */
  onPrevious?: () => void;
  /** Callback for seek (delta in seconds) */
  onSeek?: (delta: number) => void;
  /** Callback for volume change (delta -1 to 1) */
  onVolumeChange?: (delta: number) => void;
  /** Callback for mute toggle */
  onMuteToggle?: () => void;
  /** Callback when like action is triggered */
  onLike?: () => void;
  /** Callback when download is triggered */
  onDownload?: () => void;
  /** Callback when add to queue is triggered */
  onAddToQueue?: () => void;
  /** Callback when play next is triggered */
  onPlayNext?: () => void;
  /** Callback when shuffle is triggered */
  onShuffle?: () => void;
  /** Callback when repeat is triggered */
  onRepeat?: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

/**
 * Format a shortcut for display
 */
export function formatTrackShortcut(shortcut: TrackShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlOrCmd) {
    // Use Cmd on Mac, Ctrl on Windows/Linux
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  
  // Format the key nicely
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case ' ':
      keyDisplay = 'Space';
      break;
    case 'ArrowLeft':
      keyDisplay = '←';
      break;
    case 'ArrowRight':
      keyDisplay = '→';
      break;
    case 'ArrowUp':
      keyDisplay = '↑';
      break;
    case 'ArrowDown':
      keyDisplay = '↓';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }
  
  parts.push(keyDisplay);
  return parts.join(' + ');
}

/**
 * Hook for handling track-level keyboard shortcuts
 */
export function useTrackKeyboardShortcuts({
  selectedTrack,
  onLike,
  onDownload,
  onAddToQueue,
  onPlayNext,
  onShuffle,
  enabled = true,
}: UseTrackKeyboardShortcutsOptions = {}) {
  const {
    isPlaying,
    playTrack,
    pauseTrack,
    shuffle,
    toggleShuffle,
    repeat,
    toggleRepeat,
    nextTrack,
    previousTrack,
  } = usePlayerStore();

  const { seek, setVolume, getCurrentTime, audioElement } = useGlobalAudioPlayer();

  /**
   * Check if a keyboard event matches a shortcut
   */
  const matchesShortcut = useCallback((
    e: KeyboardEvent,
    shortcut: TrackShortcut
  ): boolean => {
    const isMac = navigator.platform.includes('Mac');
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    
    return (
      e.key === shortcut.key &&
      (shortcut.ctrlOrCmd ? ctrlOrCmd : !ctrlOrCmd) &&
      (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
      (shortcut.alt ? e.altKey : !e.altKey)
    );
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    // Playback shortcuts
    if (matchesShortcut(e, defaultTrackShortcuts.play_pause)) {
      e.preventDefault();
      if (isPlaying) {
        pauseTrack();
      } else {
        playTrack();
      }
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.next_track)) {
      e.preventDefault();
      nextTrack();
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.previous_track)) {
      e.preventDefault();
      previousTrack();
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.seek_forward)) {
      e.preventDefault();
      const currentTime = getCurrentTime();
      seek(currentTime + 10);
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.seek_backward)) {
      e.preventDefault();
      const currentTime = getCurrentTime();
      seek(Math.max(0, currentTime - 10));
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.volume_up)) {
      e.preventDefault();
      if (audioElement) {
        setVolume(Math.min(1, audioElement.volume + 0.1));
      }
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.volume_down)) {
      e.preventDefault();
      if (audioElement) {
        setVolume(Math.max(0, audioElement.volume - 0.1));
      }
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.mute)) {
      e.preventDefault();
      if (audioElement) {
        setVolume(audioElement.volume > 0 ? 0 : 1);
      }
      return;
    }

    // Library shortcuts (require selected track)
    if (selectedTrack) {
      if (matchesShortcut(e, defaultTrackShortcuts.like_track)) {
        e.preventDefault();
        onLike?.();
        return;
      }

      if (matchesShortcut(e, defaultTrackShortcuts.download_track)) {
        e.preventDefault();
        onDownload?.();
        return;
      }

      if (matchesShortcut(e, defaultTrackShortcuts.add_to_queue)) {
        e.preventDefault();
        onAddToQueue?.();
        return;
      }

      if (matchesShortcut(e, defaultTrackShortcuts.play_next)) {
        e.preventDefault();
        onPlayNext?.();
        return;
      }
    }

    // Other shortcuts
    if (matchesShortcut(e, defaultTrackShortcuts.shuffle)) {
      e.preventDefault();
      if (onShuffle) {
        onShuffle();
      } else {
        toggleShuffle();
      }
      return;
    }

    if (matchesShortcut(e, defaultTrackShortcuts.repeat)) {
      e.preventDefault();
      toggleRepeat();
      return;
    }
  }, [
    matchesShortcut,
    isPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    seek,
    getCurrentTime,
    setVolume,
    audioElement,
    toggleShuffle,
    toggleRepeat,
    selectedTrack,
    onLike,
    onDownload,
    onAddToQueue,
    onPlayNext,
    onShuffle,
  ]);

  // Register event listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: defaultTrackShortcuts,
    formatShortcut: formatTrackShortcut,
    isPlaying,
    shuffle,
    repeat,
  };
}
