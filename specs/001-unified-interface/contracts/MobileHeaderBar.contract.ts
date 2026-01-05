/**
 * MobileHeaderBar Component Contract
 * 
 * Standardized page header for mobile-first interface with back button,
 * title, action buttons, and optional search bar.
 * 
 * @since 2026-01-05
 * @version 1.0.0
 */

import { ReactNode, ComponentType } from 'react';

export interface HeaderAction {
  /** Unique action identifier */
  id: string;
  
  /** Action icon component (Lucide React icon) */
  icon: ComponentType<{ className?: string }>;
  
  /** Action label (for accessibility) */
  label: string;
  
  /** Action click handler */
  onClick: () => void;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Show loading spinner */
  loading?: boolean;
  
  /** Badge count (notifications, etc.) */
  badgeCount?: number;
}

export interface MobileHeaderBarProps {
  /** Page title */
  title: string;
  
  /** Title alignment
   * @default 'center'
   */
  titleAlign?: 'left' | 'center';
  
  /** Show back button
   * @default auto-detect from navigation history
   */
  showBackButton?: boolean;
  
  /** Back button click handler
   * @default navigate back in history
   */
  onBackClick?: () => void;
  
  /** Action buttons (max 2, right-aligned)
   * @maxItems 2
   */
  actions?: HeaderAction[];
  
  /** Show search bar */
  showSearch?: boolean;
  
  /** Search placeholder text
   * @default 'Search...'
   */
  searchPlaceholder?: string;
  
  /** Search value (controlled) */
  searchValue?: string;
  
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  
  /** Sticky positioning
   * @default true
   */
  sticky?: boolean;
  
  /** Backdrop blur effect
   * @default true
   */
  backdropBlur?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Custom children (replaces default content) */
  children?: ReactNode;
}

/**
 * Touch Target Requirements:
 * - Back button: 44x44px minimum
 * - Action buttons: 44x44px minimum
 * - Search input: 44px height minimum
 * 
 * Accessibility Requirements:
 * - Back button must have aria-label="Go back"
 * - Action buttons must have aria-label from label prop
 * - Search input must have proper aria-label
 * 
 * Telegram Integration:
 * - Back button triggers Telegram BackButton when visible
 * - Action buttons provide haptic feedback (light impact)
 * 
 * Safe Area Handling:
 * - Automatically applies safe-area-inset-top padding
 * - Handles Dynamic Island on iPhone 14 Pro+
 */

export type MobileHeaderBarComponent = React.FC<MobileHeaderBarProps>;
