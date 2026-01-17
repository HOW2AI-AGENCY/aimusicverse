/**
 * Studio Keyboard Shortcuts Hook
 * Handles all keyboard shortcuts for the studio shell
 */

import { useEffect, useCallback } from 'react';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface UseStudioKeyboardShortcutsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  tracks: StudioTrack[];
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVersionChange: (trackId: string, label: string) => void;
}

export function useStudioKeyboardShortcuts({
  isPlaying,
  currentTime,
  duration,
  tracks,
  onPlayPause,
  onSeek,
  onUndo,
  onRedo,
  onToggleMute,
  onToggleSolo,
  onVersionChange,
}: UseStudioKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const firstTrack = tracks[0];

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        onPlayPause();
        break;

      case 'KeyZ':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
        }
        break;

      case 'KeyM':
        if (firstTrack) {
          onToggleMute(firstTrack.id);
        }
        break;

      case 'KeyS':
        if (!e.ctrlKey && !e.metaKey && firstTrack) {
          onToggleSolo(firstTrack.id);
        }
        break;

      case 'Digit1':
        if (firstTrack?.versions?.length) {
          const versionA = firstTrack.versions[0];
          if (versionA) {
            onVersionChange(firstTrack.id, versionA.label);
          }
        }
        break;

      case 'Digit2':
        if (firstTrack?.versions?.length && firstTrack.versions.length > 1) {
          const versionB = firstTrack.versions[1];
          if (versionB) {
            onVersionChange(firstTrack.id, versionB.label);
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 5));
        break;

      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(duration, currentTime + 5));
        break;

      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;
    }
  }, [
    tracks,
    currentTime,
    duration,
    onPlayPause,
    onSeek,
    onUndo,
    onRedo,
    onToggleMute,
    onToggleSolo,
    onVersionChange,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
