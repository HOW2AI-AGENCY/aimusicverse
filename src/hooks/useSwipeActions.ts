/**
 * Swipe Actions Hook
 * Feature: 032-professional-ui
 * 
 * Horizontal swipe gestures for list items with action reveals
 */

import { useState, useCallback, useRef } from 'react';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeActionsOptions {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  overshootThreshold?: number;
  disabled?: boolean;
}

interface SwipeState {
  offset: number;
  direction: 'left' | 'right' | null;
  isOpen: boolean;
  activeAction: string | null;
}

export function useSwipeActions({
  leftActions = [],
  rightActions = [],
  threshold = 80,
  overshootThreshold = 150,
  disabled = false,
}: SwipeActionsOptions) {
  const [state, setState] = useState<SwipeState>({
    offset: 0,
    direction: null,
    isOpen: false,
    activeAction: null,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || disabled) return;

    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Determine scroll direction on first move
    if (isHorizontal.current === null) {
      isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
      if (!isHorizontal.current) {
        isDragging.current = false;
        return;
      }
    }

    if (!isHorizontal.current) return;

    e.preventDefault();

    const direction = deltaX > 0 ? 'right' : 'left';
    const actions = direction === 'right' ? leftActions : rightActions;
    
    if (actions.length === 0) return;

    const maxOffset = Math.min(Math.abs(deltaX), overshootThreshold);
    const offset = direction === 'right' ? maxOffset : -maxOffset;

    // Determine active action based on offset
    let activeAction: string | null = null;
    if (Math.abs(offset) >= threshold && actions.length > 0) {
      activeAction = actions[0].id;
      
      // Haptic at threshold crossing
      if (!state.activeAction && activeAction) {
        triggerHapticFeedback('light');
      }
    }

    setState({
      offset,
      direction,
      isOpen: false,
      activeAction,
    });
  }, [disabled, leftActions, rightActions, threshold, overshootThreshold, state.activeAction]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || disabled) return;
    isDragging.current = false;

    const { offset, direction, activeAction } = state;

    if (Math.abs(offset) >= overshootThreshold && activeAction) {
      // Execute action immediately on overshoot
      const actions = direction === 'right' ? leftActions : rightActions;
      const action = actions.find(a => a.id === activeAction);
      
      if (action) {
        triggerHapticFeedback('heavy');
        action.onAction();
      }
      
      setState({
        offset: 0,
        direction: null,
        isOpen: false,
        activeAction: null,
      });
    } else if (Math.abs(offset) >= threshold) {
      // Open actions panel
      const openOffset = direction === 'right' ? threshold : -threshold;
      setState(prev => ({
        ...prev,
        offset: openOffset,
        isOpen: true,
      }));
      triggerHapticFeedback('medium');
    } else {
      // Reset
      setState({
        offset: 0,
        direction: null,
        isOpen: false,
        activeAction: null,
      });
    }
  }, [disabled, state, leftActions, rightActions, threshold, overshootThreshold]);

  const close = useCallback(() => {
    setState({
      offset: 0,
      direction: null,
      isOpen: false,
      activeAction: null,
    });
  }, []);

  const executeAction = useCallback((actionId: string) => {
    const action = [...leftActions, ...rightActions].find(a => a.id === actionId);
    if (action) {
      triggerHapticFeedback('medium');
      action.onAction();
      close();
    }
  }, [leftActions, rightActions, close]);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    close,
    executeAction,
    leftActions,
    rightActions,
  };
}

export default useSwipeActions;
