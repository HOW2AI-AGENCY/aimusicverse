/**
 * StudioShell - Modular Studio Layout
 * 
 * Split from original 1835-line component into focused subcomponents
 * Each component is under 500 lines per Constitution v3.0.0
 * 
 * Migration in progress - original StudioShell.tsx still works
 * but new code should use the modular components.
 * 
 * @module components/studio/unified/StudioShell
 */

// Re-export original StudioShell for backward compatibility
export { StudioShell } from '../StudioShell';

// New modular components
export { StudioShellHeader } from './StudioShellHeader';
export { AddTrackDialog } from './AddTrackDialog';

// Hooks
export { useStudioShellState } from './useStudioShellState';
export { useStudioKeyboardShortcuts } from './useStudioKeyboardShortcuts';
export { useStudioStemSync } from './useStudioStemSync';
export { useStudioDialogState } from './useStudioDialogState';
export { useStudioAudioSetup } from './useStudioAudioSetup';

// Types
export * from './types';
