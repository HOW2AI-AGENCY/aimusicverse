/**
 * UnifiedStudioContent Subcomponents
 *
 * Split from original 1477-line component into focused subcomponents.
 * Each component is under 500 lines per Spec 001 requirements.
 *
 * Components:
 * - StudioAudioManager (180 lines) - Audio engine and stem state management
 * - StudioMixerControls (181 lines) - Stem mixer controls (volume, mute, solo)
 * - StudioTimeline (125 lines) - Timeline with sections and variants
 * - StudioPlaybackControls (134 lines) - Playback controls (play, pause, seek)
 * - StudioSectionEditor (75 lines) - Section editor for track sections
 *
 * @module components/studio/unified/content
 */

// Core Components
export { useStudioAudioManager } from './StudioAudioManager';
export type { StudioAudioManagerProps, StudioAudioManagerState, StemState } from './StudioAudioManager';

export { StudioMixerControls } from './StudioMixerControls';
export type { StudioMixerControlsProps } from './StudioMixerControls';

export { StudioTimeline } from './StudioTimeline';
export type { StudioTimelineProps } from './StudioTimeline';

export { StudioPlaybackControls } from './StudioPlaybackControls';
export type { StudioPlaybackControlsProps } from './StudioPlaybackControls';

export { StudioSectionEditor } from './StudioSectionEditor';
export type { StudioSectionEditorProps } from './StudioSectionEditor';
