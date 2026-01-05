/**
 * Touch target utilities for ensuring proper mobile UX
 * Minimum touch target size is 44x44px per WCAG guidelines
 */

export const TOUCH_TARGET_MIN_SIZE = 44; // px

/**
 * Class names for ensuring minimum touch target size
 * Use this for small interactive elements like icon buttons
 */
export const touchTarget = {
  // Ensures minimum 44x44px touch area (base)
  min: 'min-h-[44px] min-w-[44px]',
  // For icon buttons (44px square)
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  // For small buttons with padding
  small: 'h-11 min-h-[44px] px-4',
  // Larger comfortable touch target (48px)
  large: 'h-12 min-h-[48px] px-6',
  // For list items - full width touch target
  listItem: 'min-h-[48px] py-2',
  // For buttons in compact areas (with negative margin to expand touch area)
  compact: 'h-10 w-10 min-h-[44px] min-w-[44px] -m-1',
} as const;

/**
 * Tailwind classes for touch target sizes (use in className)
 */
export const TOUCH_CLASSES = {
  icon44: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  icon40: 'h-10 w-10 min-h-[44px] min-w-[44px]',
  button44: 'h-11 min-h-[44px]',
  button48: 'h-12 min-h-[48px]',
} as const;

/**
 * Validates if an element size meets touch target requirements
 */
export function validateTouchTarget(width: number, height: number): boolean {
  return width >= TOUCH_TARGET_MIN_SIZE && height >= TOUCH_TARGET_MIN_SIZE;
}

/**
 * Gets the recommended padding to achieve minimum touch target from content size
 */
export function getTouchTargetPadding(contentSize: number): number {
  if (contentSize >= TOUCH_TARGET_MIN_SIZE) return 0;
  return Math.ceil((TOUCH_TARGET_MIN_SIZE - contentSize) / 2);
}
