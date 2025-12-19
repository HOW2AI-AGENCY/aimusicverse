/**
 * Audio playback hooks export
 * Hooks for audio player, time tracking, and visualization (IMP046)
 */

export { useAudioPlayer } from './useAudioPlayer';
export { useAudioTime, getGlobalAudioRef, setGlobalAudioRef } from './useAudioTime';
export { useAudioVisualizer, resumeAudioContext } from './useAudioVisualizer';
export { useGlobalAudioPlayer } from './useGlobalAudioPlayer';
export { usePlayerStore } from './usePlayerState';
export { usePlaybackQueue } from './usePlaybackQueue';
export { useQueueHistory } from './useQueueHistory';
export { useWaveform } from './useWaveform';
export { useWaveformData } from './useWaveformData';
export { useBeatGrid, generateSyntheticBeatGrid } from './useBeatGrid';
export { useDebouncedAudioTime } from './useDebouncedAudioTime';
export { useOptimizedAudioPlayer } from './useOptimizedAudioPlayer';
export { usePlaybackHistory } from './usePlaybackHistory';
export { usePlaybackPosition } from './usePlaybackPosition';
export { useBufferMonitor } from './useBufferMonitor';
export { usePlayerKeyboardShortcuts } from './usePlayerKeyboardShortcuts';
export { useSmartQueue } from './useSmartQueue';
export { useAudioPerformanceMonitor } from './useAudioPerformanceMonitor';
export { useNetworkStatus } from './useNetworkStatus';
export { useReferenceAudioPlayer } from './useReferenceAudioPlayer';
export { useCrossfadePlayer } from './useCrossfadePlayer';
export { usePlayerGestures } from './usePlayerGestures';

// Export audio system diagnostics for troubleshooting
export { 
  getAudioSystemDiagnostics,
  getAudioContextState,
  ensureAudioRoutedToDestination 
} from '@/lib/audioContextManager';
