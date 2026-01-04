/**
 * Component Prop Interfaces for Unified Studio Mobile
 * 
 * @fileoverview TypeScript interfaces for all component props in the unified studio.
 * These contracts define the API surface between parent and child components.
 * 
 * @version 1.0.0
 * @date 2026-01-04
 */

// ============================================================================
// Tab Types
// ============================================================================

/**
 * Available tab types in the unified studio.
 */
export type TabType = 'player' | 'sections' | 'stems' | 'mixer' | 'actions';

/**
 * AI action types available in the studio.
 */
export type AIActionType =
  | 'separate-stems'
  | 'replace-section'
  | 'extend-track'
  | 'add-vocals'
  | 'remix'
  | 'cover';

/**
 * Dialog types that can be opened in the studio.
 */
export type DialogType =
  | 'trim'
  | 'extend'
  | 'remix'
  | 'replace-section'
  | 'export'
  | 'settings';

// ============================================================================
// Core Components
// ============================================================================

/**
 * Props for the root UnifiedStudioMobile component.
 */
export interface UnifiedStudioMobileProps {
  /**
   * Track ID for track mode.
   * Required if mode is 'track'.
   */
  trackId?: string;

  /**
   * Project ID for project mode.
   * Required if mode is 'project'.
   */
  projectId?: string;

  /**
   * Studio mode: editing a single track or a multi-track project.
   * @default 'track'
   */
  mode: 'track' | 'project';

  /**
   * Initial tab to display on mount.
   * @default 'player'
   */
  initialTab?: TabType;

  /**
   * Callback fired when user closes the studio.
   * If not provided, no close button is shown.
   */
  onClose?: () => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for the MobileStudioLayout component (tab container).
 */
export interface MobileStudioLayoutProps {
  /**
   * Currently active tab.
   */
  activeTab: TabType;

  /**
   * Callback fired when tab changes.
   */
  onTabChange: (tab: TabType) => void;

  /**
   * Track ID being edited.
   */
  trackId: string;

  /**
   * Tab content to render (lazy-loaded).
   */
  children?: React.ReactNode;

  /**
   * Whether to enable swipe gestures for tab navigation.
   * @default true
   */
  enableSwipeGestures?: boolean;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for the UnifiedStudioHeader component.
 */
export interface UnifiedStudioHeaderProps {
  /**
   * Track title to display.
   */
  title: string;

  /**
   * Track ID for actions.
   */
  trackId: string;

  /**
   * Callback fired when close button is clicked.
   */
  onClose?: () => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

// ============================================================================
// Timeline Components
// ============================================================================

/**
 * Props for the MobileDAWTimeline component.
 */
export interface MobileDAWTimelineProps {
  /**
   * Track ID for timeline data.
   */
  trackId: string;

  /**
   * Current playback time in seconds.
   */
  currentTime: number;

  /**
   * Total track duration in seconds.
   */
  duration: number;

  /**
   * Whether timeline is expanded (full height).
   * @default false
   */
  isExpanded: boolean;

  /**
   * Zoom level: 0.5 (zoomed out) to 5 (zoomed in).
   * @default 1
   */
  zoom: number;

  /**
   * Callback fired when user seeks to a new time.
   */
  onSeek: (time: number) => void;

  /**
   * Callback fired when zoom level changes (pinch gesture).
   */
  onZoomChange: (zoom: number) => void;

  /**
   * Callback fired when expand/collapse is toggled.
   */
  onToggleExpand: () => void;

  /**
   * Waveform peak data for visualization.
   */
  waveformData?: number[];

  /**
   * Whether to enable touch gestures (pinch, drag).
   * @default true
   */
  enableGestures?: boolean;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for the TimelineGestureHandler component.
 */
export interface TimelineGestureHandlerProps {
  /**
   * Container element ref for gesture binding.
   */
  containerRef: React.RefObject<HTMLDivElement>;

  /**
   * Current zoom level.
   */
  zoom: number;

  /**
   * Callback fired when pinch-zoom changes zoom level.
   */
  onZoomChange: (zoom: number) => void;

  /**
   * Callback fired when drag gesture seeks playback.
   */
  onSeek: (time: number) => void;

  /**
   * Callback fired when swipe left (next tab).
   */
  onSwipeLeft?: () => void;

  /**
   * Callback fired when swipe right (previous tab).
   */
  onSwipeRight?: () => void;

  /**
   * Track duration for seek calculations.
   */
  duration: number;

  /**
   * Whether gestures are enabled.
   * @default true
   */
  enabled?: boolean;
}

// ============================================================================
// AI Components
// ============================================================================

/**
 * Props for the AIActionsFAB (Floating Action Button).
 */
export interface AIActionsFABProps {
  /**
   * Track ID for AI actions.
   */
  trackId: string;

  /**
   * Whether FAB menu is open.
   */
  isOpen: boolean;

  /**
   * Callback fired when FAB is toggled.
   */
  onToggle: () => void;

  /**
   * FAB position (if draggable).
   * @default { x: 0, y: 0 }
   */
  position?: { x: number; y: number };

  /**
   * Available AI actions for this track.
   * If not provided, all actions are shown.
   */
  availableActions?: AIActionType[];

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for individual AI action cards.
 */
export interface AIActionCardProps {
  /**
   * Action type.
   */
  action: AIActionType;

  /**
   * Action display label.
   */
  label: string;

  /**
   * Action icon name (Lucide).
   */
  icon: string;

  /**
   * Action description.
   */
  description?: string;

  /**
   * Whether action is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Callback fired when action is triggered.
   */
  onTrigger: () => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

// ============================================================================
// Tab Content Components
// ============================================================================

/**
 * Props for the PlayerTab component.
 */
export interface PlayerTabProps {
  /**
   * Track ID to play.
   */
  trackId: string;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for the SectionsTab component.
 */
export interface SectionsTabProps {
  /**
   * Track ID for section editing.
   */
  trackId: string;

  /**
   * List of sections in the track.
   */
  sections: Section[];

  /**
   * ID of currently selected section.
   */
  activeSectionId: string | null;

  /**
   * Callback fired when section is selected.
   */
  onSectionSelect: (sectionId: string) => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Section entity interface.
 */
export interface Section {
  id: string;
  track_id: string;
  label: string;
  start_time: number;
  end_time: number;
  duration: number;
  can_replace: boolean;
  can_extend: boolean;
}

/**
 * Props for the StemsTab component.
 */
export interface StemsTabProps {
  /**
   * Track ID for stems.
   */
  trackId: string;

  /**
   * List of stems to display.
   */
  stems: Stem[];

  /**
   * Callback fired when stem mute is toggled.
   */
  onMuteToggle: (stemId: string) => void;

  /**
   * Callback fired when stem solo is toggled.
   */
  onSoloToggle: (stemId: string) => void;

  /**
   * Callback fired when stem volume changes.
   */
  onVolumeChange: (stemId: string, volume: number) => void;

  /**
   * Callback fired when stem pan changes.
   */
  onPanChange?: (stemId: string, pan: number) => void;

  /**
   * Whether to use virtualization for long lists.
   * @default true (if stems.length > 10)
   */
  virtualized?: boolean;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Stem entity interface.
 */
export interface Stem {
  id: string;
  track_id: string;
  stem_type: StemType;
  audio_url: string;
  duration: number;
  created_at: string;
  
  // UI state
  isMuted?: boolean;
  isSolo?: boolean;
  volume?: number;
  pan?: number;
}

/**
 * Stem types.
 */
export type StemType = 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other';

/**
 * Props for the MixerTab component.
 */
export interface MixerTabProps {
  /**
   * Track ID for mixer.
   */
  trackId: string;

  /**
   * Current effect chain.
   */
  effectChain: EffectChain;

  /**
   * Callback fired when effect is added.
   */
  onEffectAdd: (effect: Effect) => void;

  /**
   * Callback fired when effect is removed.
   */
  onEffectRemove: (effectId: string) => void;

  /**
   * Callback fired when effect params are updated.
   */
  onEffectUpdate: (effectId: string, params: Partial<Effect>) => void;

  /**
   * Callback fired when master volume changes.
   */
  onMasterVolumeChange?: (volume: number) => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Effect chain interface.
 */
export interface EffectChain {
  trackId: string;
  effects: Effect[];
  masterVolume: number;
}

/**
 * Effect interface.
 */
export interface Effect {
  id: string;
  type: EffectType;
  params: Record<string, number>;
  enabled: boolean;
  order: number;
}

/**
 * Effect types.
 */
export type EffectType =
  | 'reverb'
  | 'delay'
  | 'eq'
  | 'compressor'
  | 'chorus'
  | 'phaser'
  | 'distortion';

/**
 * Props for the ActionsTab component.
 */
export interface ActionsTabProps {
  /**
   * Track ID for actions.
   */
  trackId: string;

  /**
   * Available AI actions for this track.
   */
  availableActions: AIActionType[];

  /**
   * Callback fired when action is triggered.
   */
  onActionTrigger: (action: AIActionType) => void;

  /**
   * Active AI operations (in progress).
   */
  activeOperations?: AIOperation[];

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * AI operation interface.
 */
export interface AIOperation {
  id: string;
  type: AIActionType;
  track_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Shared/Reusable Components (from stem-studio)
// ============================================================================

/**
 * Props for StemTrack component (individual stem in list).
 */
export interface StemTrackProps {
  /**
   * Stem data.
   */
  stem: Stem;

  /**
   * Whether stem is currently muted.
   */
  isMuted: boolean;

  /**
   * Whether stem is currently solo.
   */
  isSolo: boolean;

  /**
   * Current volume (0-1).
   */
  volume: number;

  /**
   * Current pan (-1 to 1).
   */
  pan?: number;

  /**
   * Callback fired when mute is toggled.
   */
  onMuteToggle: () => void;

  /**
   * Callback fired when solo is toggled.
   */
  onSoloToggle: () => void;

  /**
   * Callback fired when volume changes.
   */
  onVolumeChange: (volume: number) => void;

  /**
   * Callback fired when pan changes.
   */
  onPanChange?: (pan: number) => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for WaveformVisualizer component.
 */
export interface WaveformVisualizerProps {
  /**
   * Track ID for waveform.
   */
  trackId: string;

  /**
   * Waveform peak data.
   */
  waveformData: number[];

  /**
   * Current playback time.
   */
  currentTime: number;

  /**
   * Total duration.
   */
  duration: number;

  /**
   * Height of visualizer canvas.
   * @default 100
   */
  height?: number;

  /**
   * Whether to show playhead.
   * @default true
   */
  showPlayhead?: boolean;

  /**
   * Callback fired when user clicks waveform to seek.
   */
  onSeek?: (time: number) => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

/**
 * Props for PlaybackControls component.
 */
export interface PlaybackControlsProps {
  /**
   * Whether audio is currently playing.
   */
  isPlaying: boolean;

  /**
   * Callback fired when play is clicked.
   */
  onPlay: () => void;

  /**
   * Callback fired when pause is clicked.
   */
  onPause: () => void;

  /**
   * Whether loop is enabled.
   */
  loop: boolean;

  /**
   * Callback fired when loop is toggled.
   */
  onLoopToggle: () => void;

  /**
   * Current playback speed (0.5-2.0).
   */
  speed?: number;

  /**
   * Callback fired when speed changes.
   */
  onSpeedChange?: (speed: number) => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

// ============================================================================
// Loading/Skeleton Components
// ============================================================================

/**
 * Props for TabSkeleton component (loading state).
 */
export interface TabSkeletonProps {
  /**
   * Tab type (determines skeleton layout).
   */
  tabType: TabType;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a string is a valid TabType.
 */
export function isTabType(value: string): value is TabType {
  return ['player', 'sections', 'stems', 'mixer', 'actions'].includes(value);
}

/**
 * Type guard to check if a string is a valid AIActionType.
 */
export function isAIActionType(value: string): value is AIActionType {
  return [
    'separate-stems',
    'replace-section',
    'extend-track',
    'add-vocals',
    'remix',
    'cover',
  ].includes(value);
}

/**
 * Type guard to check if a string is a valid StemType.
 */
export function isStemType(value: string): value is StemType {
  return ['vocals', 'instrumental', 'drums', 'bass', 'other'].includes(value);
}

/**
 * Type guard to check if a string is a valid EffectType.
 */
export function isEffectType(value: string): value is EffectType {
  return [
    'reverb',
    'delay',
    'eq',
    'compressor',
    'chorus',
    'phaser',
    'distortion',
  ].includes(value);
}
