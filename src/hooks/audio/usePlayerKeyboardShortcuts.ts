/**
 * Player Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcuts for audio player:
 * - Space: Play/Pause
 * - Arrow Left/Right: Seek backward/forward (5s)
 * - Arrow Up/Down: Volume up/down
 * - N: Next track
 * - P: Previous track
 * - M: Mute/Unmute
 * - S: Shuffle toggle
 * - R: Repeat toggle
 * - L: Like track
 * - Q: Open/Close queue
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from './usePlayerState';
import { useGlobalAudioPlayer } from './useGlobalAudioPlayer';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface UsePlayerKeyboardShortcutsOptions {
  enabled?: boolean;
  seekAmount?: number; // in seconds
  volumeStep?: number; // 0-1
  showToasts?: boolean;
}

export function usePlayerKeyboardShortcuts(options: UsePlayerKeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    seekAmount = 5,
    volumeStep = 0.1,
    showToasts = true,
  } = options;

  const {
    isPlaying,
    activeTrack,
    shuffle,
    repeat,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  const { seek, setVolume, getCurrentTime, audioElement } = useGlobalAudioPlayer();
  
  const lastVolumeRef = useRef<number>(1);

  /**
   * Handle play/pause
   */
  const handlePlayPause = useCallback(() => {
    hapticImpact('medium');
    if (isPlaying) {
      pauseTrack();
      if (showToasts) toast.info('Пауза');
    } else {
      playTrack();
      if (showToasts) toast.info('Воспроизведение');
    }
  }, [isPlaying, pauseTrack, playTrack, showToasts]);

  /**
   * Handle seek forward
   */
  const handleSeekForward = useCallback(() => {
    const currentTime = getCurrentTime();
    seek(currentTime + seekAmount);
    hapticImpact('light');
    if (showToasts) toast.info(`+${seekAmount}с`);
  }, [getCurrentTime, seek, seekAmount, showToasts]);

  /**
   * Handle seek backward
   */
  const handleSeekBackward = useCallback(() => {
    const currentTime = getCurrentTime();
    seek(Math.max(0, currentTime - seekAmount));
    hapticImpact('light');
    if (showToasts) toast.info(`-${seekAmount}с`);
  }, [getCurrentTime, seek, seekAmount, showToasts]);

  /**
   * Handle volume up
   */
  const handleVolumeUp = useCallback(() => {
    if (!audioElement) return;
    const newVolume = Math.min(1, audioElement.volume + volumeStep);
    setVolume(newVolume);
    hapticImpact('light');
    if (showToasts) toast.info(`Громкость: ${Math.round(newVolume * 100)}%`);
  }, [audioElement, setVolume, volumeStep, showToasts]);

  /**
   * Handle volume down
   */
  const handleVolumeDown = useCallback(() => {
    if (!audioElement) return;
    const newVolume = Math.max(0, audioElement.volume - volumeStep);
    setVolume(newVolume);
    hapticImpact('light');
    if (showToasts) toast.info(`Громкость: ${Math.round(newVolume * 100)}%`);
  }, [audioElement, setVolume, volumeStep, showToasts]);

  /**
   * Handle mute toggle
   */
  const handleMuteToggle = useCallback(() => {
    if (!audioElement) return;
    
    if (audioElement.volume > 0) {
      lastVolumeRef.current = audioElement.volume;
      setVolume(0);
      hapticImpact('medium');
      if (showToasts) toast.info('Звук выключен');
    } else {
      setVolume(lastVolumeRef.current);
      hapticImpact('medium');
      if (showToasts) toast.info('Звук включен');
    }
  }, [audioElement, setVolume, showToasts]);

  /**
   * Handle next track
   */
  const handleNextTrack = useCallback(() => {
    nextTrack();
    hapticImpact('medium');
    if (showToasts) toast.info('Следующий трек');
  }, [nextTrack, showToasts]);

  /**
   * Handle previous track
   */
  const handlePreviousTrack = useCallback(() => {
    previousTrack();
    hapticImpact('medium');
    if (showToasts) toast.info('Предыдущий трек');
  }, [previousTrack, showToasts]);

  /**
   * Handle shuffle toggle
   */
  const handleShuffleToggle = useCallback(() => {
    toggleShuffle();
    hapticImpact('medium');
    const newState = !shuffle;
    if (showToasts) {
      toast.info(newState ? 'Перемешивание включено' : 'Перемешивание выключено');
    }
  }, [toggleShuffle, shuffle, showToasts]);

  /**
   * Handle repeat toggle
   */
  const handleRepeatToggle = useCallback(() => {
    toggleRepeat();
    hapticImpact('medium');
    
    // Calculate next repeat mode
    const modes = ['off', 'all', 'one'] as const;
    const currentIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    const labels = {
      off: 'Повтор выключен',
      all: 'Повтор всех',
      one: 'Повтор трека',
    };
    
    if (showToasts) toast.info(labels[nextMode]);
  }, [toggleRepeat, repeat, showToasts]);

  /**
   * Keyboard event handler
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default for handled shortcuts
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      switch (event.code) {
        case 'Space':
          preventDefault();
          handlePlayPause();
          break;

        case 'ArrowRight':
          if (!event.shiftKey) {
            preventDefault();
            handleSeekForward();
          }
          break;

        case 'ArrowLeft':
          if (!event.shiftKey) {
            preventDefault();
            handleSeekBackward();
          }
          break;

        case 'ArrowUp':
          preventDefault();
          handleVolumeUp();
          break;

        case 'ArrowDown':
          preventDefault();
          handleVolumeDown();
          break;

        case 'KeyN':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            handleNextTrack();
          }
          break;

        case 'KeyP':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            handlePreviousTrack();
          }
          break;

        case 'KeyM':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            handleMuteToggle();
          }
          break;

        case 'KeyS':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            handleShuffleToggle();
          }
          break;

        case 'KeyR':
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            handleRepeatToggle();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    handlePlayPause,
    handleSeekForward,
    handleSeekBackward,
    handleVolumeUp,
    handleVolumeDown,
    handleNextTrack,
    handlePreviousTrack,
    handleMuteToggle,
    handleShuffleToggle,
    handleRepeatToggle,
  ]);

  return {
    handlePlayPause,
    handleSeekForward,
    handleSeekBackward,
    handleVolumeUp,
    handleVolumeDown,
    handleNextTrack,
    handlePreviousTrack,
    handleMuteToggle,
    handleShuffleToggle,
    handleRepeatToggle,
  };
}

/**
 * Keyboard Shortcuts Help Component
 */
export function getPlayerKeyboardShortcuts() {
  return [
    { key: 'Space', description: 'Воспроизведение/Пауза' },
    { key: '→', description: 'Перемотка вперед (5с)' },
    { key: '←', description: 'Перемотка назад (5с)' },
    { key: '↑', description: 'Увеличить громкость' },
    { key: '↓', description: 'Уменьшить громкость' },
    { key: 'N', description: 'Следующий трек' },
    { key: 'P', description: 'Предыдущий трек' },
    { key: 'M', description: 'Вкл/Выкл звук' },
    { key: 'S', description: 'Перемешивание' },
    { key: 'R', description: 'Повтор' },
  ];
}
