/**
 * Telegram WebApp Types
 * Comprehensive type definitions for Telegram Mini Apps API
 */

export interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => void;
}

export interface TelegramSecondaryButton extends TelegramMainButton {
  position: 'left' | 'right' | 'top' | 'bottom';
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    position?: 'left' | 'right' | 'top' | 'bottom';
  }) => void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface TelegramSettingsButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  start_param?: string;
}

export interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (error: Error | null, stored: boolean) => void) => void;
  getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
  getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
  removeItem: (key: string, callback?: (error: Error | null, removed: boolean) => void) => void;
  removeItems: (keys: string[], callback?: (error: Error | null, removed: boolean) => void) => void;
  getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
}

export interface TelegramBiometricManager {
  isInited: boolean;
  isBiometricAvailable: boolean;
  biometricType: 'finger' | 'face' | 'unknown';
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  isBiometricTokenSaved: boolean;
  deviceId: string;
  init: (callback?: () => void) => void;
  requestAccess: (params: { reason?: string }, callback?: (granted: boolean) => void) => void;
  authenticate: (params: { reason?: string }, callback?: (success: boolean, token?: string) => void) => void;
  updateBiometricToken: (token: string, callback?: (success: boolean) => void) => void;
  openSettings: () => void;
}

export interface TelegramAccelerometer {
  isStarted: boolean;
  x: number;
  y: number;
  z: number;
  start: (params?: { refresh_rate?: number }, callback?: (started: boolean) => void) => void;
  stop: (callback?: () => void) => void;
}

export interface TelegramGyroscope {
  isStarted: boolean;
  x: number;
  y: number;
  z: number;
  start: (params?: { refresh_rate?: number }, callback?: (started: boolean) => void) => void;
  stop: (callback?: () => void) => void;
}

export interface TelegramDeviceOrientation {
  isStarted: boolean;
  absolute: boolean;
  alpha: number;
  beta: number;
  gamma: number;
  start: (params?: { refresh_rate?: number; need_absolute?: boolean }, callback?: (started: boolean) => void) => void;
  stop: (callback?: () => void) => void;
}

export interface HomeScreenStatus {
  status: 'unsupported' | 'unknown' | 'added' | 'missed';
}

export type InvoiceStatus = 'paid' | 'cancelled' | 'pending' | 'failed';

export interface PopupParams {
  title?: string;
  message: string;
  buttons?: PopupButton[];
}

export interface PopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text?: string;
}

export interface ScanQrPopupParams {
  text?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isFullscreen?: boolean;
  
  // UI Components
  HapticFeedback: TelegramHapticFeedback;
  MainButton: TelegramMainButton;
  SecondaryButton?: TelegramSecondaryButton;
  BackButton: TelegramBackButton;
  SettingsButton?: TelegramSettingsButton;
  CloudStorage: TelegramCloudStorage;
  
  // Sensors & Biometrics (optional - newer APIs)
  BiometricManager?: TelegramBiometricManager;
  Accelerometer?: TelegramAccelerometer;
  Gyroscope?: TelegramGyroscope;
  DeviceOrientation?: TelegramDeviceOrientation;
  
  // Core Methods
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: (...args: unknown[]) => void) => void;
  offEvent: (eventType: string, callback: (...args: unknown[]) => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: InvoiceStatus) => void) => void;
  showPopup: (params: PopupParams, callback?: (button_id?: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: ScanQrPopupParams, callback?: (text: string) => boolean) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string | null) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
  requestContact: (callback?: (shared: boolean) => void) => void;
  
  // Extended Methods (newer API versions)
  lockOrientation?: () => void;
  unlockOrientation?: () => void;
  isVersionAtLeast: (version: string) => boolean;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  shareURL?: (url: string, text?: string) => void;
  downloadFile?: (params: { url: string; file_name: string }, callback?: (success: boolean) => void) => void;
  checkHomeScreenStatus?: (callback: (result: HomeScreenStatus) => void) => void;
  addToHomeScreen?: () => void;
  
  // Allow additional properties for future API extensions
  [key: string]: unknown;
}

// Window extension
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Helper to get typed Telegram WebApp
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

// Helper to get typed HapticFeedback
export function getTelegramHaptic(): TelegramHapticFeedback | null {
  return getTelegramWebApp()?.HapticFeedback ?? null;
}

// Type for CloudStorage callback errors
export type CloudStorageError = Error | null;
export type CloudStorageCallback<T> = (error: CloudStorageError, value: T) => void;
