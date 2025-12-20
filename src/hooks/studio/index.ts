/**
 * Stem Studio hooks export
 * 
 * SAFE EXPORTS ONLY - types and lightweight utilities
 * 
 * WARNING: Do NOT add useStemAudioEngine, useMultiTrackAudio, useStemStudioEngine
 * here - they create AudioContext at module level and cause 
 * "Cannot access 't' before initialization" errors in production.
 * 
 * Import those directly from their files:
 * - import { useStemAudioEngine } from '@/hooks/studio/useStemAudioEngine'
 * - import { useMultiTrackAudio } from '@/hooks/studio/useMultiTrackAudio'
 * - import { useStemStudioEngine } from '@/hooks/studio/useStemStudioEngine'
 */

// Safe type exports (no runtime code)
export type {
  StemEffects,
  EQSettings,
  CompressorSettings,
  ReverbSettings,
} from './useStemAudioEngine';

// Safe constant exports (extracted to avoid pulling in the whole engine)
export { 
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
  defaultEQSettings,
  defaultCompressorSettings,
  defaultReverbSettings,
} from './stemEffectsConfig';

// Safe hooks - no AudioContext dependencies
export { useStudioDialogs } from './useStudioDialogs';
export { useTrimExport } from './useTrimExport';
export { useMidiSync } from './useMidiSync';
export { useStemAudioSync } from './useStemAudioSync';
export { useStemControls } from './useStemControls';
export type { StemState } from './useStemControls';
export { useStudioKeyboardShortcuts, formatShortcut } from './useStudioKeyboardShortcuts';
export type { KeyboardShortcut } from './useStudioKeyboardShortcuts';
export { 
  useMixPresets, 
  useAutoSaveMix, 
  generatePresetForStems,
  defaultMixPresets,
} from './useMixPresets';
export type { MixPreset, StemConfig } from './useMixPresets';
export { useLoopRegion } from './useLoopRegion';
export type { LoopRegion } from './useLoopRegion';
export { 
  useStudioAudio, 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from './useStudioAudio';

// Multi-track DAW store (safe - just Zustand)
export { useStudioProjectStore } from '@/stores/useStudioProjectStore';
export type { 
  StudioProject, 
  StudioTrack, 
  StudioClip, 
  ClipType 
} from '@/stores/useStudioProjectStore';
