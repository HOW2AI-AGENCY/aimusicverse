/**
 * Telegram Context Types
 * 
 * Type definitions for Telegram Mini App integration.
 * Extracted from TelegramContext.tsx for modularity.
 * 
 * @module contexts/telegram/types
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TelegramWebApp = any;

export interface TelegramUser {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface MainButtonOptions {
  color?: string;
  textColor?: string;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface SecondaryButtonOptions {
  color?: string;
  textColor?: string;
  position?: 'left' | 'right';
}

export interface PopupParams {
  title?: string;
  message: string;
  buttons?: Array<{ id: string; type: string; text: string }>;
}

export interface ShareToStoryOptions {
  media_url: string;
  text?: string;
  link?: string;
  widget_link?: { url: string; name?: string };
}

export interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  platform: string;
  initData: string;
  isInitialized: boolean;
  isDevelopmentMode: boolean;
  
  // Buttons
  showMainButton: (text: string, onClick: () => void, options?: MainButtonOptions) => void;
  hideMainButton: () => void;
  showSecondaryButton: (text: string, onClick: () => void, options?: SecondaryButtonOptions) => void;
  hideSecondaryButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  showSettingsButton: (onClick: () => void) => void;
  hideSettingsButton: () => void;
  
  // Dialogs
  showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  
  // Feedback
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => void;
  
  // Window control
  close: () => void;
  expand: () => void;
  ready: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  
  // Fullscreen (Mini App 2.0)
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  isFullscreen: boolean;
  
  // Orientation
  lockOrientation: () => void;
  unlockOrientation: () => void;
  
  // Links
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  
  // Sharing
  shareToStory: (mediaUrl: string, options?: ShareToStoryOptions) => void;
  shareURL: (url: string, text?: string) => void;
  
  // QR Scanner
  showQRScanner: (text?: string, callback?: (data: string) => boolean) => void;
  closeQRScanner: () => void;
  
  // Downloads
  downloadFile: (url: string, fileName: string, callback?: (success: boolean) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeAreaHandlers {
  handleViewportChanged: (() => void) | null;
  handleFullscreenChanged: (() => void) | null;
  handleSafeAreaChanged: (() => void) | null;
  handleContentSafeAreaChanged: (() => void) | null;
}
