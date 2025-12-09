/**
 * Audio playback hooks export
 * Hooks for audio player, time tracking, and visualization (IMP046)
 */

export { useAudioPlayer } from './useAudioPlayer';
export { useAudioTime, getGlobalAudioRef, setGlobalAudioRef } from './useAudioTime';
export { useAudioVisualizer } from './useAudioVisualizer';
export { useGlobalAudioPlayer } from './useGlobalAudioPlayer';
export { usePlayerStore } from './usePlayerState';
export { usePlaybackQueue } from './usePlaybackQueue';
export { useWaveform } from './useWaveform';
export { useDebouncedAudioTime } from './useDebouncedAudioTime';
export { useOptimizedAudioPlayer } from './useOptimizedAudioPlayer';
export { usePlaybackHistory } from './usePlaybackHistory';
export { usePlayerKeyboardShortcuts } from './usePlayerKeyboardShortcuts';
export { useSmartQueue } from './useSmartQueue';
export { useAudioPerformanceMonitor } from './useAudioPerformanceMonitor';
