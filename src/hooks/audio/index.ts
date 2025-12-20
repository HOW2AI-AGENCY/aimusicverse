/**
 * Audio playback hooks export
 * 
 * SAFE EXPORTS ONLY - hooks that don't pull in heavy audio libraries
 * 
 * WARNING: Do NOT add useWaveform, useWaveformData, useAudioVisualizer, 
 * useBeatGrid here - they pull in wavesurfer.js/Tone.js and cause 
 * "Cannot access 't' before initialization" errors in production.
 * 
 * Import those directly from their files:
 * - import { useWaveform } from '@/hooks/audio/useWaveform'
 * - import { useWaveformData } from '@/hooks/audio/useWaveformData'
 * - import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer'
 * - import { useBeatGrid } from '@/hooks/audio/useBeatGrid'
 */

// Safe exports - no heavy dependencies
export { useAudioPlayer } from './useAudioPlayer';
export { useAudioTime, getGlobalAudioRef, setGlobalAudioRef } from './useAudioTime';
export { useGlobalAudioPlayer } from './useGlobalAudioPlayer';
export { usePlayerStore } from './usePlayerState';
export { usePlaybackQueue } from './usePlaybackQueue';
export { useQueueHistory } from './useQueueHistory';
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

// Safe audio context utilities (lazy initialization)
export { 
  getAudioSystemDiagnostics,
  getAudioContextState,
  ensureAudioRoutedToDestination 
} from '@/lib/audioContextManager';
