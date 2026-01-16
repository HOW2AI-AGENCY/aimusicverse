/**
 * View Store
 *
 * Manages studio view settings (zoom, grid, snap, etc.).
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/useViewStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';
import type { ViewMode } from './types';
import { createDefaultViewSettings } from './types';

const viewLogger = logger.child({ module: 'ViewStore' });

// ============ State Interface ============

interface ViewState {
  // View settings
  zoom: number;
  viewMode: ViewMode;
  snapToGrid: boolean;
  gridSize: number;

  // Actions
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
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
