/**
 * Unified Studio Store (Legacy Re-export)
 * 
 * This file is maintained for backward compatibility.
 * The actual implementation has been split into domain slices in src/stores/studio/
 * 
 * @deprecated Import from '@/stores/studio' instead:
 * ```typescript
 * // New modular imports (preferred)
 * import { useProjectStore, useTrackStore, useViewStore } from '@/stores/studio';
 * 
 * // Legacy compatibility (still works)
 * import { useUnifiedStudioStore } from '@/stores/studio';
 * ```
 * 
 * Constitution v3.0.0 Compliance:
 * - Original file: 1361 lines (violated 500 line limit)
 * - Refactored into 6 slices, each under 350 lines
 * 
 * @see src/stores/studio/index.ts - Main entry point
 * @see src/stores/studio/types.ts - Shared types
 * @see src/stores/studio/slices/ - Domain slices
 */

// Re-export everything from the modular store
export * from './studio';

// Re-export the composed store as default for convenience
export { useUnifiedStudioStore as default } from './studio';
