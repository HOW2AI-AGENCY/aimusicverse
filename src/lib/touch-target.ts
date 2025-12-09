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
  // Ensures minimum 44x44px touch area
  min: 'min-h-[44px] min-w-[44px]',
  // For icon buttons (40px base + padding for 44px total)
  icon: 'p-2 min-h-[44px] min-w-[44px]',
  // For small buttons
  small: 'min-h-[44px] px-4',
  // Larger comfortable touch target
  large: 'min-h-[48px] px-6',
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
