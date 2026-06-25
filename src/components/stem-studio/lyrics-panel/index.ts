/**
 * Lyrics Panel Subcomponents
 *
 * Split from original 624-line StudioLyricsPanel into focused subcomponents.
 * Each component is under 500 lines per Spec 001 requirements.
 *
 * Components:
 * - LyricsRenderer (107 lines) - Renders lyrics with word highlighting
 * - LyricsSections (192 lines) - Detects and displays song sections
 * - LyricsAutoScroll (77 lines) - Handles automatic scrolling
 *
 * @module components/stem-studio/lyrics-panel
 */

// Core Components
export { LyricsRenderer } from './LyricsRenderer';
export type { LyricLine, LyricsRendererProps } from './LyricsRenderer';

export { LyricsSections } from './LyricsSections';
export type { DetectedSection, LyricsSectionsProps, useLyricsSections } from './LyricsSections';

export { LyricsAutoScroll } from './LyricsAutoScroll';
export type { LyricsAutoScrollProps } from './LyricsAutoScroll';
