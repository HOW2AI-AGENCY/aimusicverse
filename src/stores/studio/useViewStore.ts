/**
 * View Store
 *
 * Manages studio view settings (zoom, grid, snap, etc.).
 * Persists settings to localStorage for user preference retention.
 *
 * @module stores/studio/useViewStore
 *
 * @example
 * ```tsx
 * import { useViewStore } from '@/stores/studio';
 *
 * function ZoomControls() {
 *   const { zoom, setZoom, snapToGrid, setSnapToGrid } = useViewStore();
 *
 *   return (
 *     <div>
 *       <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} />
 *       <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
 *     </div>
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';
import type { ViewMode } from './types';
import { createDefaultViewSettings } from './types';

const viewLogger = logger.child({ module: 'ViewStore' });

// ============ State Interface ============

/**
 * View state and actions
 */
interface ViewState {
  /** Current zoom level (0-100) */
  zoom: number;
  /** View mode: timeline, mixer, or compact */
  viewMode: ViewMode;
  /** Whether to snap clips to grid */
  snapToGrid: boolean;
  /** Grid subdivision size */
  gridSize: number;

  /** Set zoom level */
  setZoom: (zoom: number) => void;
  /** Set view mode */
  setViewMode: (mode: ViewMode) => void;
  /** Toggle snap to grid */
  setSnapToGrid: (snap: boolean) => void;
  /** Set grid subdivision size */
  setGridSize: (size: number) => void;
  /** Reset all view settings to defaults */
  resetView: () => void;
}

// ============ Store Implementation ============

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...createDefaultViewSettings(),

      /**
       * Set zoom level
       */
      setZoom: (zoom: number) => {
        set({ zoom });
        viewLogger.debug('Zoom changed', { zoom });
      },

      /**
       * Set view mode
       */
      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
        viewLogger.debug('View mode changed', { mode });
      },

      /**
       * Toggle snap to grid
       */
      setSnapToGrid: (snap: boolean) => {
        set({ snapToGrid: snap });
        viewLogger.debug('Snap to grid changed', { snap });
      },

      /**
       * Set grid size
       */
      setGridSize: (size: number) => {
        set({ gridSize: size });
        viewLogger.debug('Grid size changed', { size });
      },

      /**
       * Reset view to defaults
       */
      resetView: () => {
        set(createDefaultViewSettings());
        viewLogger.debug('View reset to defaults');
      },
    }),
    {
      name: 'musicverse-studio-view-storage',
    }
  )
);
