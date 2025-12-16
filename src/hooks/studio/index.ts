/**
 * Stem Studio hooks export
 * Hooks for stem separation and audio studio functionality (IMP046)
 * 
 * @task T064 - Added useLoopRegion hook for loop region selection
 */

export { useStemStudioEngine } from './useStemStudioEngine';
export { 
  useStemAudioEngine,
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
  defaultEQSettings,
  defaultCompressorSettings,
  defaultReverbSettings,
} from './useStemAudioEngine';
export type {
  StemEffects,
  EQSettings,
  CompressorSettings,
  ReverbSettings,
} from './useStemAudioEngine';
export { useStudioPlayer } from './useStudioPlayer';
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
export { useMultiTrackAudio } from './useMultiTrackAudio';
export type { MultiTrackAudioState } from './useMultiTrackAudio';
export { 
  useStudioAudio, 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from './useStudioAudio';
