/**
 * Audio playback hooks - BARREL FILE DISABLED
 * 
 * ⚠️ DO NOT RE-EXPORT ANYTHING FROM THIS FILE ⚠️
 * 
 * This barrel file is intentionally empty to prevent circular dependencies
 * and premature AudioContext initialization that causes:
 * "Cannot access 't' before initialization" errors in production.
 * 
 * ALWAYS use direct imports instead:
 * 
 * import { usePlayerStore } from '@/hooks/audio/usePlayerState';
 * import { useAudioPlayer } from '@/hooks/audio/useAudioPlayer';
 * import { useGlobalAudioPlayer } from '@/hooks/audio/useGlobalAudioPlayer';
 * import { usePlaybackQueue } from '@/hooks/audio/usePlaybackQueue';
 * import { useWaveform } from '@/hooks/audio/useWaveform';
 * import { useWaveformData } from '@/hooks/audio/useWaveformData';
 * import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
 * import { useBeatGrid } from '@/hooks/audio/useBeatGrid';
 * 
 * Audio context utilities:
 * import { getAudioSystemDiagnostics } from '@/lib/audioContextManager';
 */

// Intentionally empty - use direct imports only
