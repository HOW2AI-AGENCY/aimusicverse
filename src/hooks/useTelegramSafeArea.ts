/**
 * Telegram Mini App Safe Area Hook
 * Provides reactive safe area values and ready-to-use CSS styles
 * Based on production guide for Telegram Mini Apps (Bot API 9.0+)
 */

import { useMemo } from 'react';

export interface UseTelegramSafeAreaOptions {
  /** Add extra padding for BottomNavigation (80px) */
  withBottomNav?: boolean;
  /** Consider MainButton in bottom padding */
  withMainButton?: boolean;
  /** Extra top padding in pixels */
  extraTop?: number;
  /** Extra bottom padding in pixels */
  extraBottom?: number;
}

export interface SafeAreaStyles {
  paddingTop: string;
  paddingBottom: string;
  minHeight: string;
}

export interface SafeAreaValues {
  top: string;
  bottom: string;
  left: string;
  right: string;
  contentTop: string;
  contentBottom: string;
  viewportHeight: string;
  viewportStableHeight: string;
}

/**
 * Get CSS variable value with fallback
 */
const getCSSVar = (name: string, fallback: string): string => {
  return `var(${name}, ${fallback})`;
};

/**
 * Hook for Telegram Mini App safe areas
 * Returns ready-to-use CSS styles for containers
 */
export function useTelegramSafeArea(options: UseTelegramSafeAreaOptions = {}): SafeAreaStyles {
  const { 
    withBottomNav = false, 
    withMainButton = true,
    extraTop = 0,
    extraBottom = 0 
  } = options;

  const styles = useMemo<SafeAreaStyles>(() => {
    // Top padding: combine system safe area + Telegram content safe area
    const topExtra = extraTop > 0 ? ` + ${extraTop}px` : '';
    const paddingTop = `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 44px)${topExtra}, env(safe-area-inset-top, 44px)${topExtra}))`;
    
    // Bottom padding: system safe area OR Telegram content safe area (MainButton), plus extras
    let bottomParts: string[] = [];
    
    // Always include system safe area
    bottomParts.push('var(--tg-safe-area-inset-bottom, 34px)');
    bottomParts.push('env(safe-area-inset-bottom, 34px)');
    
    // Include MainButton space if requested
    if (withMainButton) {
      bottomParts.push('var(--tg-content-safe-area-inset-bottom, 60px)');
    }
    
    // Calculate extra bottom (BottomNav + custom extra)
    let bottomExtra = extraBottom;
    if (withBottomNav) {
      bottomExtra += 80; // BottomNavigation height
    }
    
    const bottomExtraStr = bottomExtra > 0 ? ` + ${bottomExtra}px` : '';
    const paddingBottom = `calc(max(${bottomParts.join(', ')})${bottomExtraStr})`;
    
    // Min height using stable viewport height
    const minHeight = 'var(--tg-viewport-stable-height, 100vh)';
    
    return {
      paddingTop,
      paddingBottom,
      minHeight,
    };
  }, [withBottomNav, withMainButton, extraTop, extraBottom]);

  return styles;
}

/**
 * Get raw safe area CSS variable values
 */
export function useTelegramSafeAreaValues(): SafeAreaValues {
  return useMemo(() => ({
    top: getCSSVar('--tg-safe-area-inset-top', '44px'),
    bottom: getCSSVar('--tg-safe-area-inset-bottom', '34px'),
    left: getCSSVar('--tg-safe-area-inset-left', '0px'),
    right: getCSSVar('--tg-safe-area-inset-right', '0px'),
    contentTop: getCSSVar('--tg-content-safe-area-inset-top', '0px'),
    contentBottom: getCSSVar('--tg-content-safe-area-inset-bottom', '60px'),
    viewportHeight: getCSSVar('--tg-viewport-height', '100vh'),
    viewportStableHeight: getCSSVar('--tg-viewport-stable-height', '100vh'),
  }), []);
}

/**
 * CSS class-based safe area utilities
 */
export const safeAreaClasses = {
  /** Header with top safe area */
  headerTop: 'pt-[calc(max(var(--tg-content-safe-area-inset-top,0px)+var(--tg-safe-area-inset-top,44px),env(safe-area-inset-top,44px))+0.5rem)]',
  
  /** Container with bottom nav safe area */
  containerWithNav: 'pb-[calc(max(var(--tg-content-safe-area-inset-bottom,60px),var(--tg-safe-area-inset-bottom,34px),env(safe-area-inset-bottom,34px))+80px)]',
  
  /** Container without bottom nav */
  containerNoNav: 'pb-[max(var(--tg-content-safe-area-inset-bottom,60px),var(--tg-safe-area-inset-bottom,34px),env(safe-area-inset-bottom,34px))]',
  
  /** Full height using stable viewport */
  fullHeight: 'min-h-[var(--tg-viewport-stable-height,100vh)]',
};
