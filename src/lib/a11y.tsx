/**
 * Accessibility utilities and hooks
 * Phase 5: WCAG 2.1 AA compliance helpers
 */

import * as React from 'react';

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement is read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook for managing focus trap within a container
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    // Focus first element
    firstElement?.focus();
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

/**
 * Hook for handling keyboard navigation in lists
 */
export function useArrowKeyNavigation<T extends HTMLElement>(
  items: React.RefObject<T>[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options;
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const verticalKeys = ['ArrowUp', 'ArrowDown'];
    const horizontalKeys = ['ArrowLeft', 'ArrowRight'];
    
    const allowedKeys = orientation === 'both' 
      ? [...verticalKeys, ...horizontalKeys]
      : orientation === 'vertical' 
        ? verticalKeys 
        : horizontalKeys;
    
    if (!allowedKeys.includes(e.key)) return;
    
    e.preventDefault();
    
    const isNext = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const maxIndex = items.length - 1;
    
    let newIndex: number;
    if (isNext) {
      newIndex = activeIndex >= maxIndex ? (loop ? 0 : maxIndex) : activeIndex + 1;
    } else {
      newIndex = activeIndex <= 0 ? (loop ? maxIndex : 0) : activeIndex - 1;
    }
    
    setActiveIndex(newIndex);
    items[newIndex]?.current?.focus();
  }, [activeIndex, items, loop, orientation]);
  
  return { activeIndex, setActiveIndex, handleKeyDown };
}

/**
 * Hook for reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    typeof window !== 'undefined' 
      ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches 
      : false
  );
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Hook for high contrast mode detection
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-contrast: more)').matches
      : false
  );
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-contrast: more)');
    if (!mediaQuery) return;
    
    const handler = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersHighContrast;
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0;
export function useId(prefix = 'id'): string {
  const [id] = React.useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * Hook for managing aria-live regions
 */
export function useAriaLive() {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);
  
  return { announce };
}

/**
 * Component for visually hiding content but keeping it accessible to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ 
  href, 
  children = 'Перейти к основному содержимому' 
}: { 
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </a>
  );
}

/**
 * Ensure proper color contrast ratio
 */
export function checkContrastRatio(foreground: string, background: string): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
} {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  };
}
