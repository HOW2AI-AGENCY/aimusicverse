/**
 * Accessibility Utilities
 * Feature: 032-professional-ui
 *
 * Helper functions for WCAG AA compliance and screen reader support.
 * Ensures the UI is accessible to all users.
 * 
 * Includes:
 * - ID generation for ARIA
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation helpers
 * - React hooks for a11y
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Generate unique ID for accessibility attributes
 *
 * Usage:
 *   const id = generateA11yId('button');
 *   <button id={id} aria-describedby={`${id}-desc`}>...</button>
 */
export const generateA11yId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Check if reduced motion is preferred
 *
 * Usage:
 *   if (prefersReducedMotion()) {
 *     // Skip animations
 *   }
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if dark mode is preferred
 *
 * Usage:
 *   if (prefersDarkMode()) {
 *     // Use dark colors
 *   }
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Announce message to screen readers
 *
 * Usage:
 *   announceToScreenReader('Loading complete');
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within a container (for modals, dialogs)
 *
 * Usage:
 *   trapFocus(modalRef.current);
 */
export const trapFocus = (container: HTMLElement | null): (() => void) => {
  if (!container) return () => {};

  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Get ARIA label for icon-only buttons
 *
 * Usage:
 *   <button aria-label={getIconA11yLabel('play', 'Play track')}>...</button>
 */
export const getIconA11yLabel = (iconName: string, context?: string): string => {
  if (context) return context;

  const iconLabels: Record<string, string> = {
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    skip: 'Skip',
    rewind: 'Rewind',
    forward: 'Forward',
    heart: 'Like',
    'heart-filled': 'Liked',
    share: 'Share',
    download: 'Download',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    menu: 'Menu',
    settings: 'Settings',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    add: 'Add',
    remove: 'Remove',
    check: 'Check',
    chevronLeft: 'Previous',
    chevronRight: 'Next',
    chevronUp: 'Up',
    chevronDown: 'Down',
    expand: 'Expand',
    collapse: 'Collapse',
  };

  return iconLabels[iconName] || iconName;
};

/**
 * Validate color contrast (WCAG AA)
 *
 * Usage:
 *   const contrast = getContrastRatio('#ffffff', '#000000'); // 21
 *   const passes = meetsWcagAA(contrast, 'large'); // true
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [r2, g2, b2] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
  };

  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWcagAA = (contrastRatio: number, isLargeText: boolean): boolean => {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
};

export const meetsWcagAAA = (contrastRatio: number, isLargeText: boolean): boolean => {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
};

/**
 * Handle keyboard navigation for custom components
 *
 * Usage:
 *   <div
 *     role="listbox"
 *     tabIndex={0}
 *     onKeyDown={handleKeyboardNavigation({
 *       onEnter: () => select(),
 *       onEscape: () => close(),
 *       onArrowUp: () => navigate(-1),
 *       onArrowDown: () => navigate(1),
 *     })}
 *   >
 */
export interface KeyboardHandlers {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}

export const handleKeyboardNavigation = (handlers: KeyboardHandlers) => {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handlers.onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        handlers.onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        handlers.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handlers.onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handlers.onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handlers.onArrowRight?.();
        break;
      case 'Home':
        e.preventDefault();
        handlers.onHome?.();
        break;
      case 'End':
        e.preventDefault();
        handlers.onEnd?.();
        break;
    }
  };
};

// ============= React Hooks =============

/**
 * Hook for making screen reader announcements
 */
export function useLiveAnnounce() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefers;
}

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    previousFocusRef.current = document.activeElement;
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [active]);

  return containerRef;
}

/**
 * Hook for roving focus in lists/toolbars
 */
export function useRovingFocus<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const focusables = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [role="option"], [role="menuitem"], [role="tab"]'
    );
    
    if (focusables.length === 0) return;

    let newIndex = focusedIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (focusedIndex + 1) % focusables.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (focusedIndex - 1 + focusables.length) % focusables.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = focusables.length - 1;
        break;
      default:
        return;
    }

    setFocusedIndex(newIndex);
    focusables[newIndex].focus();
  }, [focusedIndex]);

  return { containerRef, focusedIndex, setFocusedIndex, onKeyDown: handleKeyDown };
}

/**
 * Hook to detect keyboard navigation
 */
export function useFocusVisible() {
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setIsKeyboardNav(true);
    };
    const handleMouseDown = () => setIsKeyboardNav(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardNav;
}

/**
 * Focus ring class presets for consistent styling
 */
export const focusRingClasses = {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  inset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  light: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2',
  tight: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  glow: 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.4)]',
};

export default {
  generateA11yId,
  prefersReducedMotion,
  prefersDarkMode,
  announceToScreenReader,
  trapFocus,
  getIconA11yLabel,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  handleKeyboardNavigation,
  useLiveAnnounce,
  usePrefersReducedMotion,
  useFocusTrap,
  useRovingFocus,
  useFocusVisible,
  focusRingClasses,
};
