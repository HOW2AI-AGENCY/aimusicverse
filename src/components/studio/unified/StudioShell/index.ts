/**
 * StudioShell - Modular Studio Layout
 *
 * Split from original 1852-line component into focused subcomponents
 * Each component is under 500 lines per Spec 001 requirements.
 *
 * Components:
 * - StudioShellHeader (230 lines) - Header with navigation and actions
 * - StudioShellTransportBar (130 lines) - Transport controls (play, volume)
 * - StudioShellContent (210 lines) - Main content area (timeline, track list)
 * - StudioShellMobileNav (90 lines) - Mobile FAB and navigation
 * - StudioDialogs (442 lines) - All dialogs and sheets
 * - AddTrackDialog (106 lines) - Add track dialog
 *
 * @module components/studio/unified/StudioShell
 */

// Re-export original StudioShell for backward compatibility
export { StudioShell } from "../StudioShell";

// Core UI Components
export { StudioShellHeader } from "./StudioShellHeader";
export { StudioShellTransportBar } from "./StudioShellTransportBar";
export { StudioShellContent } from "./StudioShellContent";
export { StudioShellMobileNav } from "./StudioShellMobileNav";
export { StudioDialogs } from "./StudioDialogs";
export { AddTrackDialog } from "./AddTrackDialog";

// Custom Hooks
export { useStudioShellState } from "./useStudioShellState";
export { useStudioKeyboardShortcuts } from "./useStudioKeyboardShortcuts";
export { useStudioStemSync } from "./useStudioStemSync";
export { useStudioDialogState } from "./useStudioDialogState";
export { useStudioAudioSetup } from "./useStudioAudioSetup";

// Types
export * from "./types";
