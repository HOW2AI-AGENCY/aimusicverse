/**
 * useEnhancedKeyboard - Enhanced keyboard handling for iOS
 * Provides better keyboard height detection and smooth animations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isOpen: boolean;
  height: number;
  animating: boolean;
}

export function useEnhancedKeyboard() {
  const [state, setState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
    animating: false,
  });
  
  const prevHeightRef = useRef(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check if we're in a Telegram Mini App
    const tg = (window as any).Telegram?.WebApp;
    
    const handleViewportChange = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      const keyboardHeight = Math.max(0, window.innerHeight - visualViewport.height);
      const isKeyboardOpen = keyboardHeight > 100; // threshold for keyboard

      // Detect animation start
      if (keyboardHeight !== prevHeightRef.current) {
        setState(prev => ({ ...prev, animating: true }));
        
        // Clear previous timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // Set animation end after transition
        animationTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, animating: false }));
        }, 300);
      }

      prevHeightRef.current = keyboardHeight;

      setState(prev => ({
        ...prev,
        isOpen: isKeyboardOpen,
        height: keyboardHeight,
      }));
    };

    // Telegram-specific viewport handling
    if (tg?.viewportStableHeight) {
      const handleTgViewport = () => {
        const stableHeight = tg.viewportStableHeight;
        const currentHeight = tg.viewportHeight;
        const keyboardHeight = Math.max(0, stableHeight - currentHeight);
        
        setState(prev => ({
          ...prev,
          isOpen: keyboardHeight > 50,
          height: keyboardHeight,
        }));
      };

      tg.onEvent?.('viewportChanged', handleTgViewport);
      handleTgViewport();

      return () => {
        tg.offEvent?.('viewportChanged', handleTgViewport);
      };
    }

    // Standard viewport handling
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleViewportChange);
      visualViewport.addEventListener('scroll', handleViewportChange);
      handleViewportChange();

      return () => {
        visualViewport.removeEventListener('resize', handleViewportChange);
        visualViewport.removeEventListener('scroll', handleViewportChange);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }
  }, []);

  // Scroll input into view when keyboard opens
  const scrollToInput = useCallback((element: HTMLElement | null) => {
    if (!element || !state.isOpen) return;

    // Wait for keyboard animation
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  }, [state.isOpen]);

  // Get safe padding style for bottom content
  const getBottomPadding = useCallback((baseOffset = 16) => {
    if (!state.isOpen) {
      return `max(${baseOffset}px, env(safe-area-inset-bottom))`;
    }
    return `${state.height + baseOffset}px`;
  }, [state.isOpen, state.height]);

  return {
    ...state,
    scrollToInput,
    getBottomPadding,
  };
}
