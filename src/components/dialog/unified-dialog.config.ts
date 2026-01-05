/**
 * Unified Dialog Configuration
 *
 * Variant configurations for the UnifiedDialog component family
 */

export const DIALOG_CONFIG = {
  animations: {
    open: {
      duration: 300, // milliseconds
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    close: {
      duration: 200, // milliseconds
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },

  sizes: {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px',
  },

  snapPoints: {
    default: [0.25, 0.5, 0.9], // Percentage of viewport height
    defaultSnapIndex: 1, // Start at 50% height
  },

  backdrop: {
    blur: '4px', // Backdrop blur effect
    opacity: 0.5, // Backdrop darkness
  },

  accessibility: {
    focusTrap: true, // Trap focus within dialog
    restoreFocus: true, // Restore focus to trigger element on close
    closeOnEscape: true, // Allow Escape key to close
    closeOnOverlayClick: true, // Allow clicking backdrop to close
  },

  gestures: {
    swipeToClose: true, // Enable swipe-to-dismiss on mobile
    swipeThreshold: 100, // Minimum swipe distance in pixels
    dragToMove: false, // Allow dragging dialog (not implemented)
  },

  haptic: {
    onStart: 'light', // Haptic feedback on gesture start
    onComplete: 'medium', // Haptic feedback on close complete
  },

  mobile: {
    breakpoint: 768, // Pixels - switch to mobile below this
    useSheetOnMobile: true, // Use sheet variant on mobile by default
  },
} as const;

/**
 * Dialog variant presets
 */
export const DIALOG_PRESETS = {
  modal: {
    variant: 'modal' as const,
    size: 'md' as const,
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },

  sheet: {
    variant: 'sheet' as const,
    snapPoints: DIALOG_CONFIG.snapPoints.default,
    defaultSnapPoint: DIALOG_CONFIG.snapPoints.defaultSnapIndex,
    closeOnDragDown: true,
  },

  alert: {
    variant: 'alert' as const,
    severity: 'danger' as const,
  },
} as const;
