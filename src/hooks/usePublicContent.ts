/**
 * Public Content Hooks (Legacy Re-export)
 *
 * This file is maintained for backward compatibility.
 * The actual implementation has been split into modular files in src/hooks/public-content/
 *
 * @deprecated Import from '@/hooks/public-content' instead:
 * ```typescript
 * // New modular imports (preferred)
 * import { usePublicContentBatch, usePublicTracks, getGenrePlaylists } from '@/hooks/public-content';
 *
 * // Legacy compatibility (still works)
 * import { usePublicContent, usePublicContentBatch } from '@/hooks/usePublicContent';
 * ```
 *
 * Constitution v3.0.0 Compliance:
 * - Original file: 519 lines (violated 500 line limit)
 * - Refactored into 5 modules, each under 250 lines
 *
 * @see src/hooks/public-content/index.ts - Main entry point
 * @see src/hooks/public-content/types.ts - Type definitions
 * @see src/hooks/public-content/usePublicContentBatch.ts - Batch loading
 * @see src/hooks/public-content/useBasicQueries.ts - Simple queries
 * @see src/hooks/public-content/useGenrePlaylists.ts - Genre utilities
 */

// Re-export everything from the modular hooks
export * from './public-content';
