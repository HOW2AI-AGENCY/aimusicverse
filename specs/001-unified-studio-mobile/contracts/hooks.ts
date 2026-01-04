/**
 * Hook API Contracts for Unified Studio Mobile
 * 
 * @fileoverview TypeScript interfaces for custom hooks in the unified studio.
 * These contracts define the API surface for state management and side effects.
 * 
 * @version 1.0.0
 * @date 2026-01-04
 */

import type {
  Track,
  TrackVersion,
  Stem,
  Section,
  Effect,
  EffectChain,
  AIOperation,
  TabType,
  AIActionType,
} from './components';

// ============================================================================
// useUnifiedStudio Hook
// ============================================================================

/**
 * Options for the useUnifiedStudio hook.
 */
export interface UseUnifiedStudioOptions {
  /**
   * Studio mode: editing a single track or multi-track project.
   */
  mode: 'track' | 'project';

  /**
   * Track or project ID.
   */
  id: string;

  /**
   * Whether to auto-load audio on mount.
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Initial tab to display.
   * @default 'player'
   */
  initialTab?: TabType;
}

/**
 * Return value of the useUnifiedStudio hook.
 * 
 * This is the main API for interacting with the unified studio.
 * Consolidates playback, track controls, AI actions, effects, and UI state.
 */
export interface UnifiedStudioAPI {
  // === Data ===

  /**
   * Current track (for track mode).
   */
  track: Track | null;

  /**
   * Current project (for project mode).
   */
  project: Project | null;

  /**
   * List of track states (for multi-track project mode).
   */
  tracks: TrackState[];

  /**
   * Currently active tab.
   */
  activeTab: TabType;

  /**
   * Whether data is loading.
   */
  isLoading: boolean;

  /**
   * Error message if any.
   */
  error: string | null;

  // === Playback ===

  /**
   * Playback state.
   */
  playback: PlaybackState;

  /**
   * Start playback.
   */
  play: () => void;

  /**
   * Pause playback.
   */
  pause: () => void;

  /**
   * Toggle play/pause.
   */
  togglePlay: () => void;

  /**
   * Seek to specific time.
   */
  seek: (time: number) => void;

  /**
   * Seek forward/backward by delta.
   */
  seekBy: (delta: number) => void;

  /**
   * Set playback volume (0-1).
   */
  setVolume: (volume: number) => void;

  /**
   * Set playback speed (0.5-2.0).
   */
  setSpeed: (speed: number) => void;

  /**
   * Toggle loop mode.
   */
  toggleLoop: () => void;

  // === Track Controls ===

  /**
   * Toggle mute for a track.
   */
  toggleMute: (trackId: string) => void;

  /**
   * Toggle solo for a track.
   */
  toggleSolo: (trackId: string) => void;

  /**
   * Set track volume (0-1).
   */
  setTrackVolume: (trackId: string, volume: number) => void;

  /**
   * Set track pan (-1 to 1).
   */
  setTrackPan: (trackId: string, pan: number) => void;

  // === AI Actions ===

  /**
   * Separate track into stems (vocals, instrumental, drums, bass).
   */
  separateStems: () => Promise<void>;

  /**
   * Replace a section of the track with AI-generated audio.
   */
  replaceSection: (sectionId: string, prompt: string) => Promise<void>;

  /**
   * Extend track at start or end.
   */
  extendTrack: (direction: 'start' | 'end', duration?: number) => Promise<void>;

  /**
   * Add vocals to instrumental track.
   */
  addVocals: (prompt: string) => Promise<void>;

  /**
   * Create a remix of the track.
   */
  remix: (style: string) => Promise<void>;

  /**
   * Create a cover version with different voice.
   */
  cover: (voicePrompt: string) => Promise<void>;

  /**
   * Cancel an active AI operation.
   */
  cancelAIOperation: (operationId: string) => void;

  /**
   * Active AI operations (in progress).
   */
  activeOperations: AIOperation[];

  // === Effects ===

  /**
   * Current effect chain for the active track.
   */
  trackEffects: EffectChain;

  /**
   * Set entire effect chain.
   */
  setTrackEffects: (chain: EffectChain) => void;

  /**
   * Add an effect to the chain.
   */
  addEffect: (effect: Omit<Effect, 'id'>) => void;

  /**
   * Remove an effect from the chain.
   */
  removeEffect: (effectId: string) => void;

  /**
   * Update effect parameters.
   */
  updateEffect: (effectId: string, params: Partial<Effect>) => void;

  /**
   * Toggle effect enabled/disabled.
   */
  toggleEffect: (effectId: string) => void;

  // === History (Undo/Redo) ===

  /**
   * Whether undo is available.
   */
  canUndo: boolean;

  /**
   * Whether redo is available.
   */
  canRedo: boolean;

  /**
   * Undo last action.
   */
  undo: () => void;

  /**
   * Redo last undone action.
   */
  redo: () => void;

  // === UI State ===

  /**
   * Set active tab.
   */
  setActiveTab: (tab: TabType) => void;

  /**
   * Navigate to next tab.
   */
  nextTab: () => void;

  /**
   * Navigate to previous tab.
   */
  previousTab: () => void;

  /**
   * Whether timeline is expanded.
   */
  isTimelineExpanded: boolean;

  /**
   * Toggle timeline expand/collapse.
   */
  toggleTimeline: () => void;

  /**
   * Timeline zoom level (0.5-5).
   */
  timelineZoom: number;

  /**
   * Set timeline zoom.
   */
  setTimelineZoom: (zoom: number) => void;

  // === Export ===

  /**
   * Export mixed audio as single file.
   */
  exportMix: (format?: 'mp3' | 'wav') => Promise<void>;

  /**
   * Download all stems as separate files.
   */
  downloadStems: () => Promise<void>;

  /**
   * Export project to DAW format (e.g., Ableton).
   */
  exportProject?: () => Promise<void>;
}

/**
 * Playback state interface.
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  speed: number;
  loop: boolean;
  audioContext: AudioContext | null;
}

/**
 * Track state interface (per-track in project mode).
 */
export interface TrackState {
  trackId: string;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  pan: number;
  effectChain: EffectChain;
  stems: Stem[];
  sections: Section[];
  activeSectionId: string | null;
  audioBuffer: AudioBuffer | null;
  waveformData: number[];
}

/**
 * Project interface (for multi-track mode).
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  bpm: number;
  time_signature: string;
  tracks: Track[];
}

/**
 * Track interface (core entity).
 */
export interface Track {
  id: string;
  title: string;
  artist_id: string;
  active_version_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  duration: number;
  genre: string;
  style: string;
  has_stems: boolean;
  has_sections: boolean;
  activeVersion?: TrackVersion;
  versions?: TrackVersion[];
  stems?: Stem[];
}

// ============================================================================
// useSwipeNavigation Hook
// ============================================================================

/**
 * Options for the useSwipeNavigation hook.
 */
export interface UseSwipeNavigationOptions {
  /**
   * List of tabs in order.
   */
  tabs: TabType[];

  /**
   * Currently active tab.
   */
  activeTab: TabType;

  /**
   * Callback fired when tab changes.
   */
  onTabChange: (tab: TabType) => void;

  /**
   * Whether swipe navigation is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Minimum swipe distance to trigger navigation (pixels).
   * @default 50
   */
  threshold?: number;

  /**
   * Whether to show visual feedback during swipe.
   * @default true
   */
  showFeedback?: boolean;
}

/**
 * Return value of the useSwipeNavigation hook.
 */
export interface SwipeNavigationAPI {
  /**
   * Gesture handlers to spread onto container element.
   * 
   * @example
   * const { bind } = useSwipeNavigation(options);
   * <div {...bind()} />
   */
  bind: () => GestureHandlers;

  /**
   * Whether swipe left is available (not on last tab).
   */
  canSwipeLeft: boolean;

  /**
   * Whether swipe right is available (not on first tab).
   */
  canSwipeRight: boolean;

  /**
   * Current swipe direction (null when not swiping).
   */
  swipeDirection: 'left' | 'right' | null;

  /**
   * Swipe progress (0-1, where 1 is threshold reached).
   */
  swipeProgress: number;
}

/**
 * Gesture handlers from @use-gesture/react.
 */
export interface GestureHandlers {
  onMouseDown?: (event: React.MouseEvent) => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  // ... other gesture handlers
}

// ============================================================================
// useStudioPerformance Hook
// ============================================================================

/**
 * Options for the useStudioPerformance hook.
 */
export interface UseStudioPerformanceOptions {
  /**
   * Whether to enable performance monitoring.
   * @default true
   */
  enabled?: boolean;

  /**
   * Sampling rate for FPS measurement (ms).
   * @default 1000 (1 second)
   */
  fpsInterval?: number;

  /**
   * Whether to auto-detect low-end devices.
   * @default true
   */
  autoDetectLowEnd?: boolean;
}

/**
 * Return value of the useStudioPerformance hook.
 */
export interface PerformanceAPI {
  // === Metrics ===

  /**
   * Current frames per second.
   */
  fps: number;

  /**
   * Current memory usage (MB).
   */
  memoryUsage: number;

  /**
   * Last tab switch latency (ms).
   */
  tabSwitchLatency: number;

  /**
   * Audio latency (ms).
   */
  audioLatency: number;

  // === Monitoring ===

  /**
   * Measure tab switch performance.
   * 
   * @param callback Function to execute (tab switch)
   * @returns Duration in milliseconds
   * 
   * @example
   * const latency = await measureTabSwitch(() => setActiveTab('stems'));
   */
  measureTabSwitch: (callback: () => void) => Promise<number>;

  /**
   * Report a custom performance metric.
   * 
   * @param name Metric name
   * @param value Metric value
   * 
   * @example
   * reportMetric('waveform-render-time', 45);
   */
  reportMetric: (name: string, value: number) => void;

  /**
   * Start performance mark.
   * 
   * @param name Mark name
   * 
   * @example
   * startMark('audio-load');
   * // ... load audio
   * const duration = endMark('audio-load');
   */
  startMark: (name: string) => void;

  /**
   * End performance mark and return duration.
   * 
   * @param name Mark name
   * @returns Duration in milliseconds
   */
  endMark: (name: string) => number;

  // === Device Detection ===

  /**
   * Whether current device is low-end.
   * Based on CPU cores, memory, and performance benchmarks.
   */
  isLowEndDevice: boolean;

  /**
   * Whether to reduce animations (accessibility preference or low-end).
   */
  shouldReduceAnimations: boolean;

  /**
   * Device capabilities.
   */
  deviceCapabilities: DeviceCapabilities;
}

/**
 * Device capabilities interface.
 */
export interface DeviceCapabilities {
  cpuCores: number;
  memoryGB: number;
  supportsWebGL: boolean;
  supportsWebAudio: boolean;
  supportsWorkers: boolean;
  isMobile: boolean;
  platform: 'ios' | 'android' | 'desktop';
}

// ============================================================================
// useStudioAudioEngine Hook (EXISTING - reference)
// ============================================================================

/**
 * Options for the useStudioAudioEngine hook.
 */
export interface UseStudioAudioEngineOptions {
  trackId: string;
  autoLoad?: boolean;
}

/**
 * Return value of the useStudioAudioEngine hook.
 */
export interface StudioAudioEngineAPI {
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  analyser: AnalyserNode | null;
  isLoading: boolean;
  error: string | null;
  loadAudio: (url: string) => Promise<void>;
  disposeAudio: () => void;
  getFrequencyData: () => Uint8Array | null;
  getWaveformData: () => Float32Array | null;
}

// ============================================================================
// useWaveformWorker Hook (EXISTING - reference)
// ============================================================================

/**
 * Options for the useWaveformWorker hook.
 */
export interface UseWaveformWorkerOptions {
  downsampleRate?: number;
}

/**
 * Return value of the useWaveformWorker hook.
 */
export interface WaveformWorkerAPI {
  processWaveform: (audioBuffer: AudioBuffer) => Promise<number[]>;
  isProcessing: boolean;
  error: string | null;
}

// ============================================================================
// useStudioPlayer Hook (EXISTING - reference)
// ============================================================================

/**
 * Options for the useStudioPlayer hook.
 */
export interface UseStudioPlayerOptions {
  trackId: string;
  audioUrl: string;
  autoPlay?: boolean;
}

/**
 * Return value of the useStudioPlayer hook.
 */
export interface StudioPlayerAPI {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  speed: number;
  loop: boolean;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
}

// ============================================================================
// useFeatureFlag Hook (NEW)
// ============================================================================

/**
 * Options for the useFeatureFlag hook.
 */
export interface UseFeatureFlagOptions {
  /**
   * Feature flag name.
   */
  flagName: string;

  /**
   * Default value if flag not found.
   * @default false
   */
  defaultValue?: boolean;

  /**
   * Whether to check rollout percentage for gradual release.
   * @default true
   */
  checkRollout?: boolean;
}

/**
 * Return value of the useFeatureFlag hook.
 */
export interface FeatureFlagAPI {
  /**
   * Whether feature is enabled for current user.
   */
  isEnabled: boolean;

  /**
   * Rollout percentage (0-100).
   */
  rolloutPercentage: number;

  /**
   * Whether data is loading.
   */
  isLoading: boolean;

  /**
   * Whether user is in rollout cohort.
   */
  isInCohort: boolean;
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Utility type for async function that returns void.
 */
export type AsyncVoidFunction = () => Promise<void>;

/**
 * Utility type for callback with single parameter.
 */
export type Callback<T> = (value: T) => void;

/**
 * Utility type for async callback with single parameter.
 */
export type AsyncCallback<T> = (value: T) => Promise<void>;

/**
 * Utility type for event handler.
 */
export type EventHandler<T = Event> = (event: T) => void;
