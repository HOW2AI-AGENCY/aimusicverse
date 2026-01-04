/**
 * Accessibility utilities and helpers
 * WCAG 2.1 AA compliance helpers
 */

/**
 * Minimum touch target size per WCAG (44x44px)
 */
export const TOUCH_TARGET = {
  min: 44,
  comfortable: 48,
  large: 56,
} as const;

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Trap focus within an element (for modals, dialogs)
   */
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  },

  /**
   * Skip to main content link target
   */
  skipToMain() {
    const main = document.querySelector('main, [role="main"]') as HTMLElement;
    main?.focus();
    main?.scrollIntoView({ behavior: 'smooth' });
  },
};

/**
 * Screen reader utilities
 */
export const srUtils = {
  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 1000);
  },

  /**
   * Generate unique ID for ARIA relationships
   */
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

/**
 * Color contrast utilities
 */
export const contrastUtils = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 
        ? sRGB / 12.92 
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large)
   */
  meetsWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
    return ratio >= (isLargeText ? 3 : 4.5);
  },

  /**
   * Check if contrast meets WCAG AAA (7:1 for normal text, 4.5:1 for large)
   */
  meetsWCAG_AAA(ratio: number, isLargeText: boolean = false): boolean {
    return ratio >= (isLargeText ? 4.5 : 7);
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardUtils = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowNavigation(
    e: React.KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: { loop?: boolean; orientation?: 'horizontal' | 'vertical' } = {}
  ): number {
    const { loop = true, orientation = 'vertical' } = options;
    const isVertical = orientation === 'vertical';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';

    let newIndex = currentIndex;

    if (e.key === prevKey) {
      e.preventDefault();
      newIndex = currentIndex > 0 
        ? currentIndex - 1 
        : (loop ? items.length - 1 : 0);
    } else if (e.key === nextKey) {
      e.preventDefault();
      newIndex = currentIndex < items.length - 1 
        ? currentIndex + 1 
        : (loop ? 0 : items.length - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = items.length - 1;
    }

    items[newIndex]?.focus();
    return newIndex;
  },
};

/**
 * ARIA attribute helpers
 */
export const ariaUtils = {
  /**
   * Generate common ARIA attributes for interactive elements
   */
  getButtonProps(label: string, options: { 
    pressed?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    controls?: string;
  } = {}) {
    return {
      'aria-label': label,
      ...(options.pressed !== undefined && { 'aria-pressed': options.pressed }),
      ...(options.expanded !== undefined && { 'aria-expanded': options.expanded }),
      ...(options.disabled && { 'aria-disabled': true }),
      ...(options.controls && { 'aria-controls': options.controls }),
    };
  },

  /**
   * Generate ARIA attributes for loading states
   */
  getLoadingProps(isLoading: boolean, label?: string) {
    return {
      'aria-busy': isLoading,
      ...(isLoading && label && { 'aria-label': label }),
    };
  },
};

export default {
  TOUCH_TARGET,
  focusUtils,
  srUtils,
  contrastUtils,
  keyboardUtils,
  ariaUtils,
};
