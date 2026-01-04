/**
 * useSwipeNavigation - Hook for swipe-based tab navigation
 * Supports left/right swipes for tab switching with haptic feedback
 */

import { useCallback, useRef } from 'react';
import { useHaptic } from '@/hooks/useHaptic';

interface SwipeConfig {
  /** Minimum distance in pixels to trigger a swipe */
  threshold?: number;
  /** Maximum time in ms for a swipe gesture */
  maxTime?: number;
  /** Enable haptic feedback on swipe */
  hapticFeedback?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeNavigationResult {
  handlers: SwipeHandlers;
  isSwipeActive: boolean;
}

export function useSwipeNavigation<T extends string>(
  tabs: T[],
  activeTab: T,
  onTabChange: (tab: T) => void,
  config: SwipeConfig = {}
): UseSwipeNavigationResult {
  const {
    threshold = 50,
    maxTime = 300,
    hapticFeedback = true,
  } = config;

  const { patterns } = useHaptic();
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwipeActive = useRef<boolean>(false);

  const getCurrentIndex = useCallback(() => {
    return tabs.indexOf(activeTab);
  }, [tabs, activeTab]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwipeActive.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    
    // Only track horizontal swipes (X movement > Y movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwipeActive.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Check if it's a valid horizontal swipe
    if (
      Math.abs(deltaX) > threshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && // More horizontal than vertical
      deltaTime < maxTime
    ) {
      const currentIndex = getCurrentIndex();
      
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right -> previous tab
        if (hapticFeedback) patterns.tap();
        onTabChange(tabs[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swipe left -> next tab
        if (hapticFeedback) patterns.tap();
        onTabChange(tabs[currentIndex + 1]);
      }
    }
    
    isSwipeActive.current = false;
  }, [threshold, maxTime, getCurrentIndex, tabs, onTabChange, hapticFeedback, patterns]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwipeActive: isSwipeActive.current,
  };
}
