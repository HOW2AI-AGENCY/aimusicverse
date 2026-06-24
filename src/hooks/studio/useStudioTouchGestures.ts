/**
 * useStudioTouchGestures - Advanced touch gesture handling for mobile studio
 * Provides pinch-to-zoom, swipe navigation, and gesture-based seeking
 */

import { useRef, useState, useCallback, useMemo } from 'react';
import { useGesture } from '@use-gesture/react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { logger } from '@/lib/logger';

interface TouchGestureOptions {
  /** Enable pinch-to-zoom */
  enableZoom?: boolean;
  /** Min zoom level (default: 0.5) */
  minZoom?: number;
  /** Max zoom level (default: 4) */
  maxZoom?: number;
  /** Enable horizontal swipe */
  enableSwipe?: boolean;
  /** Swipe velocity threshold (default: 0.5) */
  swipeVelocity?: number;
  /** Enable tap-to-seek */
  enableTapSeek?: boolean;
  /** Duration for seek calculations */
  duration?: number;
  /** Snap to beat grid */
  snapToBeat?: boolean;
  /** BPM for beat snapping */
  bpm?: number;
}

interface TouchGestureState {
  zoom: number;
  offset: number;
  isDragging: boolean;
  isPinching: boolean;
  lastTapTime: number;
}

interface TouchGestureActions {
  setZoom: (zoom: number) => void;
  setOffset: (offset: number) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface TouchGestureResult {
  state: TouchGestureState;
  actions: TouchGestureActions;
  bindGestures: ReturnType<typeof useGesture>;
}

const ZOOM_STEP = 0.25;
const DOUBLE_TAP_THRESHOLD = 300;

export function useStudioTouchGestures(
  options: TouchGestureOptions = {}
): TouchGestureResult {
  const {
    enableZoom = true,
    minZoom = 0.5,
    maxZoom = 4,
    enableSwipe = true,
    swipeVelocity = 0.5,
    enableTapSeek = true,
    duration = 0,
    snapToBeat = false,
    bpm = 120,
  } = options;

  const haptic = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [state, setState] = useState<TouchGestureState>({
    zoom: 1,
    offset: 0,
    isDragging: false,
    isPinching: false,
    lastTapTime: 0,
  });

  // Clamp zoom to bounds
  const clampZoom = useCallback((z: number) => {
    return Math.max(minZoom, Math.min(maxZoom, z));
  }, [minZoom, maxZoom]);

  // Calculate time from position
  const positionToTime = useCallback((x: number, containerWidth: number): number => {
    if (!duration || !containerWidth) return 0;
    
    const normalizedX = (x + state.offset) / (containerWidth * state.zoom);
    let time = normalizedX * duration;
    
    // Snap to beat if enabled
    if (snapToBeat && bpm > 0) {
      const beatDuration = 60 / bpm;
      time = Math.round(time / beatDuration) * beatDuration;
    }
    
    return Math.max(0, Math.min(duration, time));
  }, [duration, state.offset, state.zoom, snapToBeat, bpm]);

  // Actions
  const actions: TouchGestureActions = useMemo(() => ({
    setZoom: (zoom: number) => {
      const clamped = clampZoom(zoom);
      setState(prev => ({ ...prev, zoom: clamped }));
      haptic.impact('light');
    },
    
    setOffset: (offset: number) => {
      setState(prev => ({ ...prev, offset }));
    },
    
    resetView: () => {
      setState(prev => ({ ...prev, zoom: 1, offset: 0 }));
      haptic.impact('medium');
    },
    
    zoomIn: () => {
      setState(prev => ({ 
        ...prev, 
        zoom: clampZoom(prev.zoom + ZOOM_STEP) 
      }));
      haptic.impact('light');
    },
    
    zoomOut: () => {
      setState(prev => ({ 
        ...prev, 
        zoom: clampZoom(prev.zoom - ZOOM_STEP) 
      }));
      haptic.impact('light');
    },
  }), [clampZoom, haptic]);

  // Gesture bindings
  const bindGestures = useGesture(
    {
      // Pinch-to-zoom
      onPinch: ({ offset: [scale], first, last, memo }) => {
        if (!enableZoom) return memo;
        
        if (first) {
          setState(prev => ({ ...prev, isPinching: true }));
          haptic.impact('light');
          return state.zoom;
        }
        
        const baseZoom = memo as number;
        const newZoom = clampZoom(baseZoom * scale);
        setState(prev => ({ ...prev, zoom: newZoom }));
        
        if (last) {
          setState(prev => ({ ...prev, isPinching: false }));
          logger.debug('[TouchGestures] Pinch end', { zoom: newZoom });
        }
        
        return memo;
      },
      
      // Horizontal drag
      onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], first, last, tap }) => {
        if (tap && enableTapSeek) {
          const now = Date.now();
          const isDoubleTap = now - state.lastTapTime < DOUBLE_TAP_THRESHOLD;
          
          if (isDoubleTap) {
            // Double tap to reset zoom
            actions.resetView();
          }
          
          setState(prev => ({ ...prev, lastTapTime: now }));
          return;
        }
        
        if (first) {
          setState(prev => ({ ...prev, isDragging: true }));
        }
        
        // Pan the timeline
        setState(prev => ({
          ...prev,
          offset: Math.max(0, prev.offset - mx * 0.5),
        }));
        
        if (last) {
          setState(prev => ({ ...prev, isDragging: false }));
          
          // Swipe detection
          if (enableSwipe && Math.abs(vx) > swipeVelocity) {
            const direction = dx > 0 ? 'right' : 'left';
            haptic.impact('light');
            logger.debug('[TouchGestures] Swipe detected', { direction, velocity: vx });
          }
        }
      },
      
      // Wheel zoom (desktop fallback)
      onWheel: ({ delta: [, dy], ctrlKey }) => {
        if (!enableZoom) return;
        
        if (ctrlKey) {
          const zoomDelta = dy > 0 ? -ZOOM_STEP : ZOOM_STEP;
          setState(prev => ({
            ...prev,
            zoom: clampZoom(prev.zoom + zoomDelta),
          }));
        }
      },
    },
    {
      pinch: {
        scaleBounds: { min: minZoom, max: maxZoom },
        rubberband: true,
      },
      drag: {
        axis: 'x',
        filterTaps: true,
        rubberband: true,
      },
    }
  );

  return {
    state,
    actions,
    bindGestures,
  };
}

/**
 * Calculate beat grid positions for visualization
 */
export function calculateBeatGrid(
  duration: number,
  bpm: number,
  zoom: number = 1
): { time: number; isDownbeat: boolean }[] {
  if (!duration || !bpm || bpm <= 0) return [];
  
  const beatDuration = 60 / bpm;
  const beats: { time: number; isDownbeat: boolean }[] = [];
  
  // Limit beats based on zoom level for performance
  const maxBeats = Math.min(1000, Math.ceil(duration / beatDuration));
  
  for (let i = 0; i < maxBeats; i++) {
    const time = i * beatDuration;
    if (time > duration) break;
    
    beats.push({
      time,
      isDownbeat: i % 4 === 0, // Assuming 4/4 time signature
    });
  }
  
  return beats;
}

/**
 * Format time for timeline display
 */
export function formatTimelineTime(seconds: number, showMs: boolean = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (showMs) {
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
