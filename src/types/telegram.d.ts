// Telegram Web App SDK type definitions
// Bot API 9.x + Mini App 2.0 features
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      is_premium?: boolean;
    };
    start_param?: string;
    query_id?: string;
    auth_date?: string;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: {
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
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  bottomBarColor?: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  isFullscreen: boolean;
  isOrientationLocked: boolean;
  safeAreaInset?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contentSafeAreaInset?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Basic methods
  ready: () => void;
  expand: () => void;
  close: () => void;
  
  // Fullscreen (Mini App 2.0)
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  
  // Orientation lock (Mini App 2.0)
  lockOrientation?: () => void;
  unlockOrientation?: () => void;
  
  // Colors
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  
  // Confirmation
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  
  // Swipes
  enableVerticalSwipes?: () => void;
  disableVerticalSwipes?: () => void;
  
  // Events
  onEvent?: (eventType: string, callback: (data?: any) => void) => void;
  offEvent?: (eventType: string, callback: (data?: any) => void) => void;
  
  // Popups
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: string; text?: string }>;
  }, callback?: (buttonId: string) => void) => void;
  
  // Links
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink?: (url: string) => void;
  
  // Share & Stories
  shareToStory?: (
    mediaUrl: string,
    options?: {
      text?: string;
      widgetLink?: { url: string; name?: string };
    }
  ) => void;
  shareURL?: (url: string, text?: string) => void;
  shareMessage?: (msgId: string, callback?: (success: boolean) => void) => void;
  
  // Downloads & Write Access
  downloadFile?: (params: { url: string; file_name: string }, callback?: (success: boolean) => void) => void;
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  
  // Inline
  switchInlineQuery?: (query: string, chooseChatTypes?: Array<'users' | 'bots' | 'groups' | 'channels'>) => void;
  
  // Home Screen
  addToHomeScreen?: () => void;
  checkHomeScreenStatus?: (callback: (status: 'unsupported' | 'unknown' | 'added' | 'missed') => void) => void;
  
  // Emoji Status (Premium)
  setEmojiStatus?: (customEmojiId: string, params?: { duration?: number }, callback?: (success: boolean) => void) => void;
  requestEmojiStatusAccess?: (callback: (granted: boolean) => void) => void;
  
  // QR Scanner
  showScanQrPopup?: (params: { text?: string }, callback?: (data: string) => boolean) => void;
  closeScanQrPopup?: () => void;
  
  // Invoice & Payments
  openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  
  // Buttons
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    hasShineEffect?: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams?: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
      has_shine_effect?: boolean;
    }) => void;
  };
  
  SecondaryButton?: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    hasShineEffect?: boolean;
    position?: 'left' | 'right' | 'top' | 'bottom';
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams?: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
      position?: 'left' | 'right' | 'top' | 'bottom';
      has_shine_effect?: boolean;
    }) => void;
  };
  
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  
  SettingsButton?: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  
  // Haptic Feedback
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  
  // Storage
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => void;
    getItem: (key: string, callback: (error: string | null, value: string) => void) => void;
    getItems: (keys: string[], callback: (error: string | null, values: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: string | null, success: boolean) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => void;
    getKeys: (callback: (error: string | null, keys: string[]) => void) => void;
  };
  
  DeviceStorage?: {
    setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => void;
    getItem: (key: string, callback: (error: string | null, value: string) => void) => void;
    getItems: (keys: string[], callback: (error: string | null, values: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: string | null, success: boolean) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => void;
    getKeys: (callback: (error: string | null, keys: string[]) => void) => void;
  };
  
  SecureStorage?: {
    isAvailable: boolean;
    setItem: (key: string, value: string, callback?: (error: string | null) => void) => void;
    getItem: (key: string, callback: (error: string | null, value: string) => void) => void;
    removeItem: (key: string, callback?: (error: string | null) => void) => void;
  };
  
  // Biometry
  BiometricManager?: {
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
  };
  
  // Sensors (Mini App 2.0)
  Accelerometer?: {
    isStarted: boolean;
    x: number;
    y: number;
    z: number;
    start: (refreshRate?: number, callback?: (started: boolean) => void) => void;
    stop: (callback?: () => void) => void;
  };
  
  Gyroscope?: {
    isStarted: boolean;
    x: number;
    y: number;
    z: number;
    start: (refreshRate?: number, callback?: (started: boolean) => void) => void;
    stop: (callback?: () => void) => void;
  };
  
  DeviceOrientation?: {
    isStarted: boolean;
    absolute: boolean;
    alpha: number;
    beta: number;
    gamma: number;
    start: (needAbsolute?: boolean, callback?: (started: boolean) => void) => void;
    stop: (callback?: () => void) => void;
  };
  
  // Location (Mini App 2.0)
  LocationManager?: {
    isInited: boolean;
    isLocationAvailable: boolean;
    isAccessRequested: boolean;
    isAccessGranted: boolean;
    init: (callback?: () => void) => void;
    getLocation: (callback?: (location: {
      latitude: number;
      longitude: number;
      altitude?: number;
      course?: number;
      speed?: number;
      horizontal_accuracy?: number;
      vertical_accuracy?: number;
    } | null) => void) => void;
    openSettings: () => void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
