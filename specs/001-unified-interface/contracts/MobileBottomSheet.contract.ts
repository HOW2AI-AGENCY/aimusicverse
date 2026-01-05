/**
 * MobileBottomSheet Component Contract
 * 
 * Mobile-native bottom sheet for forms, detail views, and content display
 * with swipe-to-dismiss gesture and snap points.
 * 
 * @since 2026-01-05
 * @version 1.0.0
 */

import { ReactNode } from 'react';

export interface MobileBottomSheetProps {
  /** Sheet open state (controlled) */
  open: boolean;
  
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  
  /** Sheet content */
  children: ReactNode;
  
  /** Sheet title (optional header) */
  title?: string;
  
  /** Sheet description (optional subtitle) */
  description?: string;
  
  /** Snap points (0.0-1.0 of viewport height)
   * @default [0.5, 0.9]
   * @example [0.25, 0.5, 0.9] for small/medium/large
   */
  snapPoints?: number[];
  
  /** Initial snap point index
   * @default 0 (first snap point)
   */
  initialSnapPoint?: number;
  
  /** Allow backdrop tap to dismiss
   * @default true
   */
  backdropDismiss?: boolean;
  
  /** Allow swipe down to dismiss
   * @default true
   */
  swipeToDismiss?: boolean;
  
  /** Show drag handle
   * @default true
   */
  showDragHandle?: boolean;
  
  /** Full screen mode (ignores snap points, fills viewport)
   * @default false
   */
  fullScreen?: boolean;
  
  /** Show close button in header
   * @default false
   */
  showCloseButton?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Z-index for stacking
   * @default 50 (Tailwind z-50)
   */
  zIndex?: number;
  
  /** Disable body scroll when open
   * @default true
   */
  disableBodyScroll?: boolean;
}

/**
 * Usage Guidelines:
 * 
 * 1. Forms (create playlist, edit profile):
 *    - snapPoints: [0.9] (full height)
 *    - swipeToDismiss: true
 *    - backdropDismiss: false (prevent accidental close)
 * 
 * 2. Menus (track actions, settings):
 *    - snapPoints: [0.5] (medium height)
 *    - swipeToDismiss: true
 *    - backdropDismiss: true
 * 
 * 3. Detail Views (track info, artist bio):
 *    - snapPoints: [0.5, 0.9] (expandable)
 *    - swipeToDismiss: true
 *    - backdropDismiss: true
 * 
 * 4. Filters (sort, genre selection):
 *    - snapPoints: [0.3] (compact)
 *    - swipeToDismiss: true
 *    - backdropDismiss: true
 * 
 * Touch Target Requirements:
 * - Drag handle: 44px height (full width)
 * - Close button: 44x44px minimum
 * - Interactive elements inside sheet: 44px minimum
 * 
 * Accessibility Requirements:
 * - role="dialog"
 * - aria-modal="true"
 * - aria-labelledby points to title element
 * - Focus trap when open
 * - Escape key to dismiss
 * 
 * Telegram Integration:
 * - Haptic feedback on drag start (selection impact)
 * - Haptic feedback on snap (light impact)
 * - Haptic feedback on close (medium impact)
 * 
 * Performance:
 * - Use Framer Motion spring physics for natural feel
 * - GPU-accelerated transform (translateY)
 * - Backdrop blur for depth effect
 */

export type MobileBottomSheetComponent = React.FC<MobileBottomSheetProps>;
