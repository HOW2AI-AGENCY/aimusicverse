/**
 * Stem Studio hooks - BARREL FILE DISABLED
 * 
 * ⚠️ DO NOT RE-EXPORT RUNTIME CODE FROM THIS FILE ⚠️
 * 
 * This barrel file only exports TYPES to prevent circular dependencies
 * and premature AudioContext initialization that causes:
 * "Cannot access 't' before initialization" errors in production.
 * 
 * ALWAYS use direct imports for hooks:
 * 
 * import { useStemAudioEngine } from '@/hooks/studio/useStemAudioEngine';
 * import { useMultiTrackAudio } from '@/hooks/studio/useMultiTrackAudio';
 * import { useStemStudioEngine } from '@/hooks/studio/useStemStudioEngine';
 * import { useStemControls } from '@/hooks/studio/useStemControls';
 * import { useStudioKeyboardShortcuts } from '@/hooks/studio/useStudioKeyboardShortcuts';
 * import { useMixPresets, useAutoSaveMix } from '@/hooks/studio/useMixPresets';
 * import { useLoopRegion } from '@/hooks/studio/useLoopRegion';
 * import { useStudioAudio } from '@/hooks/studio/useStudioAudio';
 * import { useStemAudioSync } from '@/hooks/studio/useStemAudioSync';
 * import { useStemAudioCache, getStemsByPriority } from '@/hooks/studio/useStemAudioCache';
 * import { useMasterClock } from '@/hooks/studio/useMasterClock';
 * import { useDebouncedStemControls } from '@/hooks/studio/useDebouncedStemControls';
 * import { useOptimisticVersions } from '@/hooks/studio/useOptimisticVersions';
 * import { useStudioOptimizations } from '@/hooks/studio/useStudioOptimizations';
 * import { useStudioState } from '@/hooks/studio/useStudioState';
 * import { useWaveformCache } from '@/hooks/studio/useWaveformCache';
 * import { useOptimizedPlayback } from '@/hooks/studio/useOptimizedPlayback';
 *
 * For types and constants (safe to import):
 * import type { StemEffects, MixPreset, StemState } from '@/hooks/studio/types';
 * import { defaultStemEffects, eqPresets } from '@/hooks/studio/stemEffectsConfig';
 */

// Only export types - no runtime code
export type {
  StemEffects,
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  StemConfig,
  MixPreset,
  StemState,
  LoopRegion,
  KeyboardShortcut,
} from './types';

// Export types from useStudioState
export type { 
  StemStates, 
  UseStudioStateOptions, 
  UseStudioStateReturn 
} from './useStudioState';

// Safe constant exports - no AudioContext dependencies
export { 
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
  defaultEQSettings,
  defaultCompressorSettings,
  defaultReverbSettings,
} from './stemEffectsConfig';
