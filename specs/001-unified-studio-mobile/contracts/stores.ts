/**
 * Store Interfaces for Unified Studio Mobile
 * 
 * @fileoverview TypeScript interfaces for Zustand stores in the unified studio.
 * These contracts define the state shape and actions for global state management.
 * 
 * @version 1.0.0
 * @date 2026-01-04
 */

import type {
  Track,
  TrackState,
  PlaybackState,
  EffectChain,
  Effect,
  AIOperation,
  TabType,
  AIActionType,
  Section,
  Stem,
} from './hooks';

// ============================================================================
// UnifiedStudioStore (Main Store)
// ============================================================================

/**
 * Main Zustand store for the unified studio.
 * Consolidates all studio state and actions.
 * 
 * Location: src/stores/useUnifiedStudioStore.ts (EXTEND EXISTING)
 */
export interface UnifiedStudioStore {
  // === Playback Slice (EXISTING) ===
  
  playback: PlaybackState;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
  
  // === Track Slice (EXISTING) ===
  
  /**
   * Map of track IDs to track states.
   */
  tracks: Record<string, TrackState>;
  
  /**
   * Currently active track ID.
   */
  activeTrackId: string | null;
  
  /**
   * Set active track.
   */
  setActiveTrack: (trackId: string) => void;
  
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
  
  // === UI Slice (NEW - ADD TO EXISTING STORE) ===
  
  ui: UIState;
  
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
   * Toggle timeline expand/collapse.
   */
  toggleTimeline: () => void;
  
  /**
   * Set timeline zoom level (0.5-5).
   */
  setTimelineZoom: (zoom: number) => void;
  
  /**
   * Set timeline scroll position.
   */
  setTimelineScroll: (scroll: number) => void;
  
  /**
   * Toggle FAB open/closed.
   */
  toggleFAB: () => void;
  
  /**
   * Set loading state.
   */
  setLoading: (isLoading: boolean, message?: string) => void;
  
  /**
   * Open dialog.
   */
  openDialog: (dialogType: DialogType, data?: any) => void;
  
  /**
   * Close dialog.
   */
  closeDialog: () => void;
  
  /**
   * Set low-end mode (detected or manual).
   */
  setLowEndMode: (enabled: boolean) => void;
  
  /**
   * Set reduced animations (accessibility or performance).
   */
  setReducedAnimations: (enabled: boolean) => void;
  
  // === History Slice (EXISTING in useMixerHistoryStore - MERGE) ===
  
  history: HistoryState;
  
  /**
   * Undo last action.
   */
  undo: () => void;
  
  /**
   * Redo last undone action.
   */
  redo: () => void;
  
  /**
   * Push current state to history.
   */
  pushHistory: (state: StudioState) => void;
  
  /**
   * Clear history.
   */
  clearHistory: () => void;
  
  // === Effects Slice (EXISTING) ===
  
  /**
   * Map of track IDs to effect chains.
   */
  effects: Record<string, EffectChain>;
  
  /**
   * Add effect to track.
   */
  addEffect: (trackId: string, effect: Omit<Effect, 'id'>) => void;
  
  /**
   * Remove effect from track.
   */
  removeEffect: (trackId: string, effectId: string) => void;
  
  /**
   * Update effect parameters.
   */
  updateEffect: (trackId: string, effectId: string, params: Partial<Effect>) => void;
  
  /**
   * Toggle effect enabled/disabled.
   */
  toggleEffect: (trackId: string, effectId: string) => void;
  
  /**
   * Reorder effects in chain.
   */
  reorderEffects: (trackId: string, effectId: string, newIndex: number) => void;
  
  // === AI Operations Slice (EXISTING) ===
  
  aiOperations: AIOperationsState;
  
  /**
   * Start AI operation.
   */
  startAIOperation: (type: AIActionType, params: AIOperationParams) => Promise<string>;
  
  /**
   * Update AI operation progress.
   */
  updateAIProgress: (operationId: string, progress: number) => void;
  
  /**
   * Complete AI operation.
   */
  completeAIOperation: (operationId: string, resultUrl: string) => void;
  
  /**
   * Fail AI operation.
   */
  failAIOperation: (operationId: string, errorMessage: string) => void;
  
  /**
   * Cancel AI operation.
   */
  cancelAIOperation: (operationId: string) => void;
  
  /**
   * Clear completed operations.
   */
  clearCompletedOperations: () => void;
  
  // === Reset ===
  
  /**
   * Reset entire store to initial state.
   */
  reset: () => void;
}

// ============================================================================
// UI State
// ============================================================================

/**
 * UI state slice for the unified studio.
 */
export interface UIState {
  // Tab navigation
  activeTab: TabType;
  previousTab: TabType | null;
  tabHistory: TabType[];
  
  // Timeline state
  isTimelineExpanded: boolean;
  timelineZoom: number;
  timelineScroll: number;
  
  // FAB state
  isFABOpen: boolean;
  fabPosition: { x: number; y: number };
  
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
  
  // Modals/dialogs
  activeDialog: DialogType | null;
  dialogData?: any;
  
  // Performance/accessibility
  lowEndMode: boolean;
  reducedAnimations: boolean;
}

/**
 * Dialog types.
 */
export type DialogType =
  | 'trim'
  | 'extend'
  | 'remix'
  | 'replace-section'
  | 'export'
  | 'settings';

// ============================================================================
// History State
// ============================================================================

/**
 * History state for undo/redo functionality.
 */
export interface HistoryState {
  /**
   * Past states (undo stack).
   */
  past: StudioState[];
  
  /**
   * Future states (redo stack).
   */
  future: StudioState[];
  
  /**
   * Whether undo is available.
   */
  canUndo: boolean;
  
  /**
   * Whether redo is available.
   */
  canRedo: boolean;
  
  /**
   * Maximum history size.
   * @default 50
   */
  maxSize: number;
}

/**
 * Studio state snapshot for history.
 */
export interface StudioState {
  /**
   * Timestamp of state snapshot.
   */
  timestamp: number;
  
  /**
   * Tracks state at this point.
   */
  tracks: Record<string, TrackState>;
  
  /**
   * Effects state at this point.
   */
  effects: Record<string, EffectChain>;
  
  /**
   * Playback state at this point.
   */
  playback: PlaybackState;
  
  /**
   * UI state at this point (optional, not all UI changes are saved).
   */
  ui?: Partial<UIState>;
  
  /**
   * Description of what changed (for debugging).
   */
  description?: string;
}

// ============================================================================
// AI Operations State
// ============================================================================

/**
 * AI operations state.
 */
export interface AIOperationsState {
  /**
   * Map of operation IDs to operations.
   */
  activeOperations: Map<string, AIOperation>;
  
  /**
   * Map of operation IDs to progress (0-100).
   */
  progress: Map<string, number>;
  
  /**
   * Latest error message.
   */
  latestError: string | null;
  
  /**
   * Total operations count (for tracking).
   */
  totalOperations: number;
}

/**
 * Parameters for starting an AI operation.
 */
export interface AIOperationParams {
  trackId: string;
  prompt?: string;
  duration?: number;
  sectionId?: string;
  style?: string;
  direction?: 'start' | 'end';
  // Add more as needed per operation type
}

// ============================================================================
// Persistence Config
// ============================================================================

/**
 * Zustand persist configuration for UI state.
 */
export interface UnifiedStudioPersistConfig {
  /**
   * LocalStorage key.
   */
  name: 'unified-studio-ui';
  
  /**
   * Only persist UI slice.
   */
  partialize: (state: UnifiedStudioStore) => { ui: UIState };
  
  /**
   * Version for migration.
   */
  version: number;
  
  /**
   * Migration function for version changes.
   */
  migrate?: (persistedState: any, version: number) => any;
}

// ============================================================================
// Store Actions (Helpers)
// ============================================================================

/**
 * Helper type for store setter function.
 */
export type StoreSet<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

/**
 * Helper type for store getter function.
 */
export type StoreGet<T> = () => T;

/**
 * Helper type for Zustand store creator.
 */
export type StoreCreator<T> = (
  set: StoreSet<T>,
  get: StoreGet<T>,
  api: any
) => T;

// ============================================================================
// Derived Selectors (Computed Values)
// ============================================================================

/**
 * Selectors for efficiently accessing derived state.
 * Use these instead of computing in components.
 */
export interface UnifiedStudioSelectors {
  /**
   * Get active track state.
   */
  selectActiveTrack: (state: UnifiedStudioStore) => TrackState | null;
  
  /**
   * Get active track ID.
   */
  selectActiveTrackId: (state: UnifiedStudioStore) => string | null;
  
  /**
   * Get effect chain for active track.
   */
  selectActiveEffectChain: (state: UnifiedStudioStore) => EffectChain | null;
  
  /**
   * Get stems for active track.
   */
  selectActiveStems: (state: UnifiedStudioStore) => Stem[];
  
  /**
   * Get sections for active track.
   */
  selectActiveSections: (state: UnifiedStudioStore) => Section[];
  
  /**
   * Get active AI operations.
   */
  selectActiveOperations: (state: UnifiedStudioStore) => AIOperation[];
  
  /**
   * Get whether any track is soloed.
   */
  selectHasSolo: (state: UnifiedStudioStore) => boolean;
  
  /**
   * Get playable tracks (not muted, or solo if any track is soloed).
   */
  selectPlayableTracks: (state: UnifiedStudioStore) => TrackState[];
  
  /**
   * Get whether undo is available.
   */
  selectCanUndo: (state: UnifiedStudioStore) => boolean;
  
  /**
   * Get whether redo is available.
   */
  selectCanRedo: (state: UnifiedStudioStore) => boolean;
  
  /**
   * Get current tab index (for navigation).
   */
  selectTabIndex: (state: UnifiedStudioStore) => number;
  
  /**
   * Get whether at first tab (can't go left).
   */
  selectIsFirstTab: (state: UnifiedStudioStore) => boolean;
  
  /**
   * Get whether at last tab (can't go right).
   */
  selectIsLastTab: (state: UnifiedStudioStore) => boolean;
}

// ============================================================================
// Store Middleware Configuration
// ============================================================================

/**
 * Middleware configuration for the store.
 */
export interface StoreMiddlewareConfig {
  /**
   * Enable persist middleware for UI state.
   */
  persist: boolean;
  
  /**
   * Enable devtools middleware for debugging.
   */
  devtools: boolean;
  
  /**
   * Enable immer middleware for immutable updates.
   */
  immer: boolean;
  
  /**
   * Devtools options.
   */
  devtoolsOptions?: {
    name: string;
    enabled: boolean;
  };
}

// ============================================================================
// Store Hooks (Type-safe selectors)
// ============================================================================

/**
 * Type-safe hook for using the unified studio store.
 * 
 * @example
 * // Select specific state
 * const activeTab = useUnifiedStudioStore((state) => state.ui.activeTab);
 * 
 * // Select multiple values
 * const { play, pause, isPlaying } = useUnifiedStudioStore((state) => ({
 *   play: state.play,
 *   pause: state.pause,
 *   isPlaying: state.playback.isPlaying,
 * }));
 */
export type UseUnifiedStudioStore = {
  (): UnifiedStudioStore;
  <T>(selector: (state: UnifiedStudioStore) => T): T;
};

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial state factory for the unified studio store.
 * Returns default values for all slices.
 */
export interface InitialStoreState {
  playback: PlaybackState;
  tracks: Record<string, TrackState>;
  activeTrackId: string | null;
  ui: UIState;
  history: HistoryState;
  effects: Record<string, EffectChain>;
  aiOperations: AIOperationsState;
}

/**
 * Function to create initial store state.
 */
export type CreateInitialState = (options?: {
  trackId?: string;
  initialTab?: TabType;
}) => InitialStoreState;

// ============================================================================
// Store Actions (Batching)
// ============================================================================

/**
 * Batch multiple store actions for performance.
 * Prevents multiple re-renders.
 */
export interface BatchActions {
  /**
   * Execute multiple actions in a single batch.
   * 
   * @example
   * batchActions(() => {
   *   setActiveTab('stems');
   *   toggleTimeline();
   *   setTimelineZoom(2);
   * });
   */
  (fn: () => void): void;
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export types for convenience.
 */
export type {
  TabType,
  AIActionType,
  PlaybackState,
  TrackState,
  EffectChain,
  Effect,
  AIOperation,
  Section,
  Stem,
};
