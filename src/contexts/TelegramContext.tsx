import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { telegramAuthService } from '@/services/telegram-auth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TelegramWebApp = any;

export interface TelegramUser {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  platform: string;
  initData: string;
  isInitialized: boolean;
  isDevelopmentMode: boolean;
  
  // Buttons
  showMainButton: (text: string, onClick: () => void, options?: { color?: string; textColor?: string; isActive?: boolean; isVisible?: boolean }) => void;
  hideMainButton: () => void;
  showSecondaryButton: (text: string, onClick: () => void, options?: { color?: string; textColor?: string; position?: 'left' | 'right' }) => void;
  hideSecondaryButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  showSettingsButton: (onClick: () => void) => void;
  hideSettingsButton: () => void;
  
  // Dialogs
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id: string; type: string; text: string }> }, callback?: (buttonId: string) => void) => void;
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
  shareToStory: (mediaUrl: string, options?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
  shareURL: (url: string, text?: string) => void;
  
  // QR Scanner
  showQRScanner: (text?: string, callback?: (data: string) => boolean) => void;
  closeQRScanner: () => void;
  
  // Downloads
  downloadFile: (url: string, fileName: string, callback?: (success: boolean) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

// Create a child logger for Telegram context
const telegramLogger = logger.child({ module: 'TelegramContext' });

// Boot logging helper for critical startup debugging
const bootLog = (msg: string) => {
  const entry = `[TelegramContext] ${msg}`;
  console.log(entry);
  try {
    const existing = JSON.parse(sessionStorage.getItem('musicverse_boot_log') || '[]');
    existing.push(`[${new Date().toISOString()}] ${entry}`);
    sessionStorage.setItem('musicverse_boot_log', JSON.stringify(existing));
  } catch (e) {
    // Ignore storage errors
  }
};

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [platform, setPlatform] = useState<string>('');
  const [initData, setInitData] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  // Refs to store event handlers for proper cleanup
  const safeAreaHandlersRef = useRef<{
    handleViewportChanged: (() => void) | null;
    handleFullscreenChanged: (() => void) | null;
    handleSafeAreaChanged: (() => void) | null;
    handleContentSafeAreaChanged: (() => void) | null;
  }>({
    handleViewportChanged: null,
    handleFullscreenChanged: null,
    handleSafeAreaChanged: null,
    handleContentSafeAreaChanged: null,
  });

  useEffect(() => {
    bootLog('TelegramProvider useEffect started');
    
    // Check for development mode - always enable on lovable domains or localhost
    const devMode = window.location.hostname.includes('lovable.dev') ||
                    window.location.hostname.includes('lovable.app') ||
                    window.location.hostname.includes('lovableproject.com') ||
                    window.location.hostname === 'localhost' ||
                    window.location.search.includes('dev=1');
    
    bootLog(`DevMode: ${devMode}, Telegram WebApp: ${!!window.Telegram?.WebApp}`);
    
    telegramLogger.debug('TelegramProvider initialization started', {
      hostname: window.location.hostname,
      devMode,
      hasTelegram: !!window.Telegram?.WebApp
    });
    
    setIsDevelopmentMode(devMode);

    // Ensure initialization completes even if there are errors
    let initializationTimeout: NodeJS.Timeout;
    
    const ensureInitialized = () => {
      bootLog('ensureInitialized called');
      setIsInitialized(true);
      telegramLogger.info('TelegramProvider initialized');
    };

    // Set a safety timeout to prevent infinite loading (reduced to 2.5s)
    initializationTimeout = setTimeout(() => {
      bootLog('Initialization TIMEOUT (2.5s) - forcing complete');
      telegramLogger.warn('Initialization timeout - forcing initialization complete');
      ensureInitialized();
    }, 2500);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      bootLog(`Telegram WebApp found: platform=${tg.platform}, version=${tg.version}`);
      setWebApp(tg);

      telegramLogger.info('Telegram WebApp detected', {
        platform: tg.platform,
        version: tg.version,
        colorScheme: tg.colorScheme
      });

      // Развернуть приложение на весь экран и инициализировать
      try {
        tg.ready();
        bootLog('tg.ready() called');
      } catch (e) {
        bootLog(`tg.ready() error: ${e}`);
      }
      
      try {
        tg.expand();
        bootLog('tg.expand() called');
      } catch (e) {
        bootLog(`tg.expand() error: ${e}`);
      }

      // CRITICAL: Disable vertical swipes to prevent accidental Mini App closure on iOS
      if (typeof (tg as any).disableVerticalSwipes === 'function') {
        try {
          (tg as any).disableVerticalSwipes();
          bootLog('Vertical swipes disabled');
        } catch (e) {
          bootLog(`disableVerticalSwipes error: ${e}`);
        }
      }

      // Lock orientation to portrait mode (vertical only)
      if (typeof (tg as any).lockOrientation === 'function') {
        try {
          (tg as any).lockOrientation();
          bootLog('Orientation locked');
        } catch (e) {
          bootLog(`lockOrientation error: ${e}`);
        }
      }

      // Request fullscreen mode automatically (Mini App 2.0+)
      if (typeof (tg as any).requestFullscreen === 'function') {
        try {
          (tg as any).requestFullscreen();
          bootLog('Fullscreen requested');
        } catch (e) {
          bootLog(`Fullscreen error: ${e}`);
        }
      }

      // Установка цветов header и background (requires 6.1+)
      try {
        if (tg.isVersionAtLeast?.('6.1')) {
          if (tg.setHeaderColor) {
            tg.setHeaderColor('secondary_bg_color');
          }
          if (tg.setBackgroundColor) {
            tg.setBackgroundColor('bg_color');
          }
          bootLog('Colors set');
        } else {
          bootLog('Colors skipped - version < 6.1');
        }
      } catch (e) {
        bootLog(`Colors error: ${e}`);
      }

      if (tg.initDataUnsafe?.user) {
        bootLog(`User found: ${tg.initDataUnsafe.user.first_name} (${tg.initDataUnsafe.user.id})`);
        telegramLogger.debug('Telegram user found', {
          id: tg.initDataUnsafe.user.id,
          firstName: tg.initDataUnsafe.user.first_name,
          username: tg.initDataUnsafe.user.username
        });
        setUser({
          telegram_id: tg.initDataUnsafe.user.id,
          first_name: tg.initDataUnsafe.user.first_name,
          last_name: tg.initDataUnsafe.user.last_name,
          username: tg.initDataUnsafe.user.username,
          language_code: tg.initDataUnsafe.user.language_code,
          photo_url: tg.initDataUnsafe.user.photo_url,
        });
      } else {
        bootLog('WARNING: initDataUnsafe.user not found');
        telegramLogger.warn('initDataUnsafe.user not found');
      }

      setPlatform(tg.platform);

      if (tg.initData) {
        bootLog(`InitData received, length=${tg.initData.length}`);
        telegramLogger.debug('InitData received', { length: tg.initData.length });

        // Парсим и показываем параметры для диагностики
        const params = new URLSearchParams(tg.initData);
        telegramLogger.debug('InitData params', {
          hasHash: !!params.get('hash'),
          hasUser: !!params.get('user'),
          hasAuthDate: !!params.get('auth_date')
        });

        // Seamless authentication with backend - NON-BLOCKING
        // CRITICAL: Do NOT use showPopup during initialization as it can block the app
        bootLog('Starting auth...');
        telegramAuthService.authenticateWithTelegram(tg.initData)
          .then(authData => {
            bootLog(`Auth result: ${authData ? 'success' : 'failed'}`);
            if (authData) {
              telegramLogger.info('Telegram authentication successful');
            } else {
              telegramLogger.warn('Telegram authentication failed - will retry later');
            }
          })
          .catch(err => {
            // Log error but DO NOT show popup - it blocks initialization
            bootLog(`Auth error: ${err}`);
            telegramLogger.error('Telegram authentication error', err);
          })
          .finally(() => {
            // ALWAYS ensure initialization completes regardless of auth result
            bootLog('Auth finally block - calling ensureInitialized');
            clearTimeout(initializationTimeout);
            ensureInitialized();
          });
      } else {
        // InitData отсутствует - это нормально при открытии вне Telegram
        bootLog('INFO: InitData not available (expected outside Telegram)');
        telegramLogger.info('InitData not available - running outside Telegram Mini App');
        // No initData means we can't authenticate, but still need to initialize UI
        clearTimeout(initializationTimeout);
        ensureInitialized();
      }

      setInitData(tg.initData);

      // Apply Telegram theme colors to CSS variables
      const root = document.documentElement;
      const themeParams = tg.themeParams;
      
      if (themeParams.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
      }
      if (themeParams.text_color) {
        root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
      }
      if (themeParams.button_color) {
        root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
      }
      if (themeParams.button_text_color) {
        root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
      }
      if (themeParams.secondary_bg_color) {
        root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
      }

      // Apply Safe Area Insets для iOS и Android
      // IMPORTANT: Telegram 8.0+ supports contentSafeAreaInset for fullscreen mode
      // FIX: Add protection against recursive event loops
      let isApplyingInsets = false;
      let debounceTimer: NodeJS.Timeout | null = null;
      const previousInsets = {
        contentTop: -1,
        contentBottom: -1,
        safeTop: -1,
        safeBottom: -1,
      };

      const applySafeAreaInsets = () => {
        // Prevent re-entrant calls
        if (isApplyingInsets) {
          telegramLogger.debug('Safe Area update skipped - already in progress');
          return;
        }

        // Debounce rapid calls
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          isApplyingInsets = true;
          
          try {
            const isIOS = tg.platform === 'ios';
            const isAndroid = tg.platform === 'android';
            
            // Get contentSafeAreaInset from Telegram (Mini App 8.0+)
            // This provides the actual safe area when native Telegram buttons are present
            const contentSafeArea = (tg as any).contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
            const safeArea = (tg as any).safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
            
            // Check if values actually changed - prevent unnecessary DOM updates
            if (
              previousInsets.contentTop === contentSafeArea.top &&
              previousInsets.contentBottom === contentSafeArea.bottom &&
              previousInsets.safeTop === safeArea.top &&
              previousInsets.safeBottom === safeArea.bottom
            ) {
              telegramLogger.debug('Safe Area values unchanged - skipping update');
              return;
            }

            // Update tracked values
            previousInsets.contentTop = contentSafeArea.top;
            previousInsets.contentBottom = contentSafeArea.bottom;
            previousInsets.safeTop = safeArea.top;
            previousInsets.safeBottom = safeArea.bottom;

            telegramLogger.debug('Applying Safe Area Insets', { 
              platform: tg.platform,
              contentSafeArea, 
              safeArea 
            });
            
            // Set Telegram-specific content safe area (for native buttons like Back/Settings)
            root.style.setProperty('--tg-content-safe-area-inset-top', `${contentSafeArea.top}px`);
            root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentSafeArea.bottom}px`);
            root.style.setProperty('--tg-safe-area-inset-top', `${safeArea.top}px`);
            root.style.setProperty('--tg-safe-area-inset-bottom', `${safeArea.bottom}px`);
            
            // Calculate combined safe area (max of device + Telegram native buttons)
            if (isIOS) {
              const deviceTop = 44; // typical iOS notch
              const deviceBottom = 34; // typical iOS home indicator
              root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, ${deviceTop}px), ${contentSafeArea.top}px)`);
              root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, ${deviceBottom}px), ${contentSafeArea.bottom}px)`);
            } else if (isAndroid) {
              const deviceTop = 24; // typical Android status bar
              root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, ${deviceTop}px), ${contentSafeArea.top}px)`);
              root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, 0px), ${contentSafeArea.bottom}px)`);
            } else {
              root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, 0px), ${contentSafeArea.top}px)`);
              root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, 0px), ${contentSafeArea.bottom}px)`);
            }
            
            root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
            root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
          } finally {
            isApplyingInsets = false;
          }
        }, 100); // 100ms debounce delay
      };

      // Apply initial safe area insets
      applySafeAreaInsets();

      // Event handlers for safe area and viewport changes
      const handleViewportChanged = (...args: unknown[]) => {
        // Update viewport height CSS variables
        const event = args[0] as { height?: number; stableHeight?: number; isStateStable?: boolean } | undefined;
        if (event?.height) {
          root.style.setProperty('--tg-viewport-height', `${event.height}px`);
        }
        if (event?.stableHeight) {
          root.style.setProperty('--tg-viewport-stable-height', `${event.stableHeight}px`);
        }
        telegramLogger.debug('Viewport changed', { 
          height: event?.height,
          stableHeight: event?.stableHeight,
          isStateStable: event?.isStateStable
        });
        applySafeAreaInsets();
      };
      const handleFullscreenChanged = () => {
        telegramLogger.debug('Fullscreen changed', { isFullscreen: (tg as any).isFullscreen });
        applySafeAreaInsets();
      };
      const handleSafeAreaChanged = () => applySafeAreaInsets();
      const handleContentSafeAreaChanged = () => applySafeAreaInsets();
      
      // Set initial viewport height
      if ((tg as any).viewportHeight) {
        root.style.setProperty('--tg-viewport-height', `${(tg as any).viewportHeight}px`);
      }
      if ((tg as any).viewportStableHeight) {
        root.style.setProperty('--tg-viewport-stable-height', `${(tg as any).viewportStableHeight}px`);
      }

      // Store handlers in ref for cleanup
      safeAreaHandlersRef.current = {
        handleViewportChanged,
        handleFullscreenChanged,
        handleSafeAreaChanged,
        handleContentSafeAreaChanged,
      };

      // Register event listeners
      tg.onEvent?.('viewportChanged', handleViewportChanged);
      tg.onEvent?.('fullscreenChanged', handleFullscreenChanged);
      tg.onEvent?.('safeAreaChanged', handleSafeAreaChanged);
      tg.onEvent?.('contentSafeAreaChanged', handleContentSafeAreaChanged);
      
      // Note: ensureInitialized is now called in the auth .finally() block above
    } else if (devMode) {
      // Development mode: Create mock Telegram environment for testing in Lovable
      telegramLogger.info('Development mode: Using mock Telegram data');
      
      const mockUser: TelegramUser = {
        telegram_id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru',
      };
      
      setUser(mockUser);
      setPlatform('web');
      setInitData('development_mode');
      
      // Create mock webApp object with silent logging
      const mockWebApp = {
        ready: () => telegramLogger.debug('Mock: ready()'),
        expand: () => telegramLogger.debug('Mock: expand()'),
        close: () => telegramLogger.debug('Mock: close()'),
        MainButton: {
          setText: (text: string) => telegramLogger.debug('Mock MainButton', { text }),
          show: () => telegramLogger.debug('Mock MainButton: show()'),
          hide: () => telegramLogger.debug('Mock MainButton: hide()'),
          onClick: (fn: () => void) => telegramLogger.debug('Mock MainButton: onClick set'),
          offClick: (fn: () => void) => telegramLogger.debug('Mock MainButton: offClick'),
        },
        BackButton: {
          show: () => telegramLogger.debug('Mock BackButton: show()'),
          hide: () => telegramLogger.debug('Mock BackButton: hide()'),
          onClick: (fn: () => void) => telegramLogger.debug('Mock BackButton: onClick set'),
          offClick: (fn: () => void) => telegramLogger.debug('Mock BackButton: offClick'),
        },
        HapticFeedback: {
          impactOccurred: (type: string) => telegramLogger.debug('Mock Haptic', { type }),
          notificationOccurred: (type: string) => telegramLogger.debug('Mock Notification', { type }),
          selectionChanged: () => telegramLogger.debug('Mock Selection changed'),
        },
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => {
            telegramLogger.debug('Mock CloudStorage.setItem', { key });
            localStorage.setItem(`mock_cloud_${key}`, value);
            callback?.(null, true);
          },
          getItem: (key: string, callback: (error: string | null, value: string) => void) => {
            telegramLogger.debug('Mock CloudStorage.getItem', { key });
            const value = localStorage.getItem(`mock_cloud_${key}`) || '';
            callback(null, value);
          },
          removeItem: (key: string, callback?: (error: string | null, success: boolean) => void) => {
            telegramLogger.debug('Mock CloudStorage.removeItem', { key });
            localStorage.removeItem(`mock_cloud_${key}`);
            callback?.(null, true);
          },
          getKeys: (callback: (error: string | null, keys: string[]) => void) => {
            telegramLogger.debug('Mock CloudStorage.getKeys');
            const keys = Object.keys(localStorage)
              .filter(k => k.startsWith('mock_cloud_'))
              .map(k => k.replace('mock_cloud_', ''));
            callback(null, keys);
          },
          getItems: (keys: string[], callback: (error: string | null, values: Record<string, string>) => void) => {
            telegramLogger.debug('Mock CloudStorage.getItems', { keys });
            const values: Record<string, string> = {};
            keys.forEach(key => {
              values[key] = localStorage.getItem(`mock_cloud_${key}`) || '';
            });
            callback(null, values);
          },
          removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => {
            telegramLogger.debug('Mock CloudStorage.removeItems', { keys });
            keys.forEach(key => localStorage.removeItem(`mock_cloud_${key}`));
            callback?.(null, true);
          },
        },
      } as unknown as TelegramWebApp;
      
      setWebApp(mockWebApp);
      clearTimeout(initializationTimeout);
      ensureInitialized();
    } else {
      // Not in Telegram and not in dev mode
      telegramLogger.warn('Not in Telegram and not in dev mode');
      clearTimeout(initializationTimeout);
      ensureInitialized();
    }

    // Cleanup function - remove event listeners on unmount
    return () => {
      clearTimeout(initializationTimeout);
      
      // Clean up Telegram event listeners to prevent memory leaks and recursive calls
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Remove safe area event listeners if they were registered
        if (tg.offEvent && safeAreaHandlersRef.current) {
          const handlers = safeAreaHandlersRef.current;
          
          if (handlers.handleViewportChanged) {
            tg.offEvent('viewportChanged', handlers.handleViewportChanged);
          }
          if (handlers.handleFullscreenChanged) {
            tg.offEvent('fullscreenChanged', handlers.handleFullscreenChanged);
          }
          if (handlers.handleSafeAreaChanged) {
            tg.offEvent('safeAreaChanged', handlers.handleSafeAreaChanged);
          }
          if (handlers.handleContentSafeAreaChanged) {
            tg.offEvent('contentSafeAreaChanged', handlers.handleContentSafeAreaChanged);
          }
        }
      }
    };
  }, []);

  // Store MainButton callback ref to properly unsubscribe
  const mainButtonCallbackRef = { current: null as (() => void) | null };

  const showMainButton = (text: string, onClick: () => void, options?: { color?: string; textColor?: string; isActive?: boolean; isVisible?: boolean }) => {
    if (webApp?.MainButton) {
      // Remove previous callback if exists
      if (mainButtonCallbackRef.current) {
        webApp.MainButton.offClick(mainButtonCallbackRef.current);
      }
      
      mainButtonCallbackRef.current = onClick;
      webApp.MainButton.setText(text);
      if (options?.color) webApp.MainButton.color = options.color;
      if (options?.textColor) webApp.MainButton.textColor = options.textColor;
      if (options?.isActive !== undefined) webApp.MainButton.isActive = options.isActive;
      if (options?.isVisible !== undefined) webApp.MainButton.isVisible = options.isVisible;
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
      
      telegramLogger.debug('MainButton shown', { text, isActive: options?.isActive });
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      // Properly remove callback
      if (mainButtonCallbackRef.current) {
        webApp.MainButton.offClick(mainButtonCallbackRef.current);
        mainButtonCallbackRef.current = null;
      }
      webApp.MainButton.hide();
      telegramLogger.debug('MainButton hidden');
    }
  };

  const showBackButton = (onClick: () => void) => {
    if (webApp && webApp.isVersionAtLeast?.('6.1')) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    if (webApp && webApp.isVersionAtLeast?.('6.1')) {
      webApp.BackButton.hide();
      webApp.BackButton.offClick(() => {});
    }
  };

  const showSettingsButton = (onClick: () => void) => {
    if (webApp && webApp.isVersionAtLeast?.('6.10') && (webApp as any).SettingsButton) {
      (webApp as any).SettingsButton.show();
      (webApp as any).SettingsButton.onClick(onClick);
    }
  };

  const hideSettingsButton = () => {
    if (webApp && webApp.isVersionAtLeast?.('6.10') && (webApp as any).SettingsButton) {
      (webApp as any).SettingsButton.hide();
      (webApp as any).SettingsButton.offClick(() => {});
    }
  };

  const enableClosingConfirmation = () => {
    if (webApp?.enableClosingConfirmation) {
      webApp.enableClosingConfirmation();
    }
  };

  const disableClosingConfirmation = () => {
    if (webApp?.disableClosingConfirmation) {
      webApp.disableClosingConfirmation();
    }
  };

  const showPopup = (params: { title?: string; message: string; buttons?: Array<{ id: string; type: string; text: string }> }, callback?: (buttonId: string) => void) => {
    if (webApp?.showPopup) {
      webApp.showPopup(params, callback);
    }
  };

  const showAlert = (message: string) => {
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (webApp?.showConfirm) {
      webApp.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (webApp?.HapticFeedback) {
      switch (type) {
        case 'light':
        case 'medium':
        case 'heavy':
          webApp.HapticFeedback.impactOccurred(type);
          break;
        case 'success':
        case 'error':
        case 'warning':
          webApp.HapticFeedback.notificationOccurred(type);
          break;
        case 'selection':
          webApp.HapticFeedback.selectionChanged();
          break;
      }
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  const expand = () => {
    if (webApp) {
      webApp.expand();
    }
  };

  const ready = () => {
    if (webApp) {
      webApp.ready();
    }
  };

  const openLink = (url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp?.openLink) {
      (webApp.openLink as (url: string, options?: { try_instant_view?: boolean }) => void)(url, options);
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url: string) => {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const shareToStory = (mediaUrl: string, options?: { text?: string; widget_link?: { url: string; name?: string } }) => {
    if (webApp && (webApp as any).shareToStory) {
      (webApp as any).shareToStory(mediaUrl, options);
    } else {
      telegramLogger.warn('shareToStory not available');
    }
  };

  // New Mini App 2.0 features
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showSecondaryButton = (text: string, onClick: () => void, options?: { color?: string; textColor?: string; position?: 'left' | 'right' }) => {
    if (webApp && webApp.SecondaryButton) {
      webApp.SecondaryButton.setText(text);
      if (options?.color) webApp.SecondaryButton.color = options.color;
      if (options?.textColor) webApp.SecondaryButton.textColor = options.textColor;
      if (options?.position) webApp.SecondaryButton.position = options.position;
      webApp.SecondaryButton.show();
      webApp.SecondaryButton.onClick(onClick);
    }
  };

  const hideSecondaryButton = () => {
    if (webApp?.SecondaryButton) {
      webApp.SecondaryButton.hide();
      webApp.SecondaryButton.offClick(() => {});
    }
  };

  const requestFullscreen = () => {
    if (webApp?.requestFullscreen) {
      webApp.requestFullscreen();
      setIsFullscreen(true);
      telegramLogger.info('Requested fullscreen mode');
    }
  };

  const exitFullscreen = () => {
    if (webApp?.exitFullscreen) {
      webApp.exitFullscreen();
      setIsFullscreen(false);
      telegramLogger.info('Exited fullscreen mode');
    }
  };

  const lockOrientation = () => {
    if (webApp?.lockOrientation) {
      webApp.lockOrientation();
      telegramLogger.info('Orientation locked');
    }
  };

  const unlockOrientation = () => {
    if (webApp?.unlockOrientation) {
      webApp.unlockOrientation();
      telegramLogger.info('Orientation unlocked');
    }
  };

  const shareURL = (url: string, text?: string) => {
    if (webApp?.shareURL) {
      webApp.shareURL(url, text);
    } else {
      telegramLogger.warn('shareURL not available');
    }
  };

  const showQRScanner = (text?: string, callback?: (data: string) => boolean) => {
    if (webApp?.showScanQrPopup) {
      webApp.showScanQrPopup({ text: text || 'Scan QR code' }, callback || (() => true));
    } else {
      telegramLogger.warn('QR Scanner not available');
    }
  };

  const closeQRScanner = () => {
    if (webApp?.closeScanQrPopup) {
      webApp.closeScanQrPopup();
    }
  };

  const downloadFile = (url: string, fileName: string, callback?: (success: boolean) => void) => {
    if (webApp?.downloadFile) {
      webApp.downloadFile({ url, file_name: fileName }, callback);
    } else {
      telegramLogger.warn('downloadFile not available');
      callback?.(false);
    }
  };

  const requestWriteAccess = (callback?: (granted: boolean) => void) => {
    if (webApp?.requestWriteAccess) {
      webApp.requestWriteAccess(callback);
    } else {
      telegramLogger.warn('requestWriteAccess not available');
      callback?.(false);
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        platform,
        initData,
        isInitialized,
        isDevelopmentMode,
        
        // Buttons
        showMainButton,
        hideMainButton,
        showSecondaryButton,
        hideSecondaryButton,
        showBackButton,
        hideBackButton,
        showSettingsButton,
        hideSettingsButton,
        
        // Dialogs
        showPopup,
        showAlert,
        showConfirm,
        
        // Feedback
        hapticFeedback,
        
        // Window control
        close,
        expand,
        ready,
        enableClosingConfirmation,
        disableClosingConfirmation,
        
        // Fullscreen
        requestFullscreen,
        exitFullscreen,
        isFullscreen,
        
        // Orientation
        lockOrientation,
        unlockOrientation,
        
        // Links
        openLink,
        openTelegramLink,
        
        // Sharing
        shareToStory,
        shareURL,
        
        // QR Scanner
        showQRScanner,
        closeQRScanner,
        
        // Downloads
        downloadFile,
        requestWriteAccess,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

// Component to handle deep linking using useNavigate
export const DeepLinkHandler = () => {
  const navigate = useNavigate();
  const { webApp, user, isDevelopmentMode, hapticFeedback } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const startParam = webApp?.initDataUnsafe?.start_param;
    if (!startParam) return;

    // CRITICAL: Prevent re-processing deep links on every render
    // Use sessionStorage to track if we've already processed this deep link
    const processedKey = `deeplink_processed_${startParam}`;
    if (sessionStorage.getItem(processedKey)) {
      telegramLogger.debug('Deep link already processed, skipping', { startParam });
      return;
    }
    sessionStorage.setItem(processedKey, 'true');

    telegramLogger.debug('Processing deep link', { startParam });

    // Show loading state
    setIsProcessing(true);
    hapticFeedback('light');

    // Track analytics async - get user_id from auth session
    const trackDeepLink = async (type: string, value: string, converted: boolean = true) => {
      try {
        const sessionId = sessionStorage.getItem('deeplink_session_id') || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('deeplink_session_id', sessionId);

        // Get authenticated user id if available
        const { data: { user: authUser } } = await supabase.auth.getUser();

        await supabase.from('deeplink_analytics').insert({
          deeplink_type: type,
          deeplink_value: value || null,
          user_id: authUser?.id || null,
          session_id: sessionId,
          converted,
          source: 'telegram_miniapp',
          referrer: document.referrer || null,
          metadata: {
            platform: webApp?.platform,
            version: webApp?.version,
            telegram_id: user?.telegram_id,
          },
        });
        telegramLogger.debug('Deeplink tracked', { type, value, converted });
      } catch (e) {
        telegramLogger.debug('Failed to track deeplink', { error: String(e) });
      }
    };

    // Pattern-based routing with analytics type
    const routes: [RegExp | string, (match: RegExpMatchArray | null) => string, string][] = [
      // Content deep links
      [/^track_(.+)$/, (m) => `/library?track=${m![1]}`, 'track'],
      [/^project_(.+)$/, (m) => `/projects/${m![1]}`, 'project'],
      [/^artist_(.+)$/, (m) => `/artists/${m![1]}`, 'artist'],
      [/^playlist_(.+)$/, (m) => `/playlists/${m![1]}`, 'playlist'],
      [/^album_(.+)$/, (m) => `/album/${m![1]}`, 'album'],
      [/^blog_(.+)$/, (m) => `/blog/${m![1]}`, 'blog'],
      
      // Player deep links - open fullscreen player directly
      [/^play_(.+)$/, (m) => `/player/${m![1]}`, 'play'],
      [/^player_(.+)$/, (m) => `/player/${m![1]}`, 'player'],
      [/^listen_(.+)$/, (m) => `/player/${m![1]}`, 'listen'],
      
      // Generation deep links
      [/^generate_(.+)$/, (m) => `/generate?style=${m![1]}`, 'generate'],
      [/^quick_(.+)$/, (m) => `/generate?style=${m![1]}&quick=true`, 'quick'],
      [/^remix_(.+)$/, (m) => `/generate?remix=${m![1]}`, 'remix'],
      
      // Vocal/Instrumental deep links (from Telegram bot)
      [/^vocals_(.+)$/, (m) => `/library?track=${m![1]}&action=add_vocals`, 'add_vocals'],
      [/^instrumental_(.+)$/, (m) => `/library?track=${m![1]}&action=add_instrumental`, 'add_instrumental'],
      [/^extend_(.+)$/, (m) => `/library?track=${m![1]}&action=extend`, 'extend'],
      [/^cover_(.+)$/, (m) => `/library?track=${m![1]}&action=cover`, 'cover'],
      
      // Studio deep links
      [/^studio_ref_(.+)$/, (m) => `/content-hub?tab=cloud&ref=${m![1]}`, 'studio_ref'],
      [/^studio_(.+)$/, (m) => `/studio-v2/track/${m![1]}`, 'studio'],
      
      // Track views
      [/^lyrics_(.+)$/, (m) => `/library?track=${m![1]}&view=lyrics`, 'lyrics'],
      [/^stats_(.+)$/, (m) => `/library?track=${m![1]}&view=stats`, 'stats'],
      [/^share_(.+)$/, (m) => `/library?track=${m![1]}`, 'share'],
      
      // Profile deep links
      [/^user_(.+)$/, (m) => `/profile/${m![1]}`, 'profile'],
      [/^profile_(.+)$/, (m) => `/profile/${m![1]}`, 'profile'],
      
      // Referral deep links
      [/^invite_(.+)$/, (m) => `/?ref=${m![1]}`, 'invite'],
      [/^ref_(.+)$/, (m) => `/?ref=${m![1]}`, 'referral'],
      
      // Simple routes (no capture groups)
      ['buy', () => '/buy-credits', 'buy'],
      ['credits', () => '/buy-credits', 'credits'],
      ['subscribe', () => '/buy-credits?tab=subscriptions', 'subscribe'],
      ['subscription', () => '/subscription', 'subscription'],
      ['leaderboard', () => '/rewards?tab=leaderboard', 'leaderboard'],
      ['achievements', () => '/rewards?tab=achievements', 'achievements'],
      ['analyze', () => '/?analyze=true', 'analyze'],
      ['recognize', () => '/?recognize=true', 'recognize'],
      ['shazam', () => '/?recognize=true', 'shazam'],
      ['settings', () => '/settings', 'settings'],
      ['help', () => '/settings', 'help'],
      ['onboarding', () => '/onboarding', 'onboarding'],
      ['library', () => '/library', 'library'],
      ['projects', () => '/projects', 'projects'],
      ['artists', () => '/artists', 'artists'],
      ['creative', () => '/music-lab', 'creative'],
      ['musiclab', () => '/music-lab', 'musiclab'],
      ['drums', () => '/music-lab?tab=drums', 'drums'],
      ['dj', () => '/music-lab?tab=dj', 'dj'],
      ['guitar', () => '/music-lab?tab=guitar', 'guitar'],
      ['melody', () => '/music-lab?tab=melody', 'melody'],
      ['channel', () => '/', 'channel'],
      ['news', () => '/blog', 'news'],
      ['rewards', () => '/rewards', 'rewards'],
      ['community', () => '/community', 'community'],
      ['playlists', () => '/playlists', 'playlists'],
      
      // Content hub tabs
      ['content-hub', () => '/projects', 'content_hub'],
      ['cloud', () => '/projects?tab=cloud', 'cloud'],
      ['lyrics', () => '/projects?tab=lyrics', 'lyrics'],
      ['templates', () => '/templates', 'templates'],
      
      // Pricing & tariffs
      ['pricing', () => '/pricing', 'pricing'],
      ['tariffs', () => '/pricing', 'tariffs'],
      ['shop', () => '/pricing', 'shop'],
      
      // Profile actions
      ['profile', () => '/profile', 'profile'],
      ['analytics', () => '/analytics', 'analytics'],
      
      // Admin (for admins only)
      ['admin', () => '/admin', 'admin'],
      ['feedback', () => '/admin/feedback', 'feedback'],
    ];

    // Try to match routes
    for (const [pattern, getPath, analyticsType] of routes) {
      if (typeof pattern === 'string') {
        if (startParam === pattern) {
          trackDeepLink(analyticsType, startParam);
          
          // Show toast with navigation info
          toast.info('Переход по ссылке', {
            description: getDeepLinkDescription(analyticsType, startParam),
            duration: 2000,
          });
          
          // Navigate with small delay for feedback
          setTimeout(() => {
            navigate(getPath(null));
            setIsProcessing(false);
          }, 200);
          return;
        }
      } else {
        const match = startParam.match(pattern);
        if (match) {
          trackDeepLink(analyticsType, match[1] || startParam);
          
          // Show toast with navigation info
          toast.info('Переход по ссылке', {
            description: getDeepLinkDescription(analyticsType, match[1] || startParam),
            duration: 2000,
          });
          
          // Navigate with small delay for feedback
          setTimeout(() => {
            navigate(getPath(match));
            setIsProcessing(false);
          }, 200);
          return;
        }
      }
    }

    // Fallback: unknown deep link, track and log it
    trackDeepLink('unknown', startParam, false);
    telegramLogger.warn('Unknown deep link', { startParam });
    
    toast.error('Неизвестная ссылка', {
      description: 'Ссылка не распознана',
      duration: 3000,
    });
    setIsProcessing(false);
  }, [webApp?.initDataUnsafe?.start_param, navigate, webApp?.platform, webApp?.version, user?.telegram_id, hapticFeedback]);

  // Helper function to get user-friendly descriptions
  function getDeepLinkDescription(type: string, value: string): string {
    const descriptions: Record<string, string> = {
      track: 'Открываем трек',
      project: 'Открываем проект',
      artist: 'Открываем артиста',
      playlist: 'Открываем плейлист',
      album: 'Открываем альбом',
      blog: 'Открываем статью',
      generate: 'Создание трека',
      quick: 'Быстрое создание',
      remix: 'Создание ремикса',
      vocals: 'Добавление вокала',
      instrumental: 'Создание инструментала',
      extend: 'Расширение трека',
      cover: 'Создание кавера',
      studio: 'Открываем студию',
      lyrics: 'Просмотр текста',
      stats: 'Просмотр статистики',
      share: 'Просмотр трека',
      profile: 'Открываем профиль',
      invite: 'Реферальная ссылка',
      referral: 'Реферальная ссылка',
      buy: 'Покупка кредитов',
      credits: 'Покупка кредитов',
      subscribe: 'Оформление подписки',
      subscription: 'Управление подпиской',
      library: 'Библиотека треков',
      projects: 'Мои проекты',
      artists: 'Артисты',
      community: 'Сообщество',
      playlists: 'Плейлисты',
      settings: 'Настройки',
      help: 'Помощь',
    };
    
    return descriptions[type] || 'Обработка ссылки...';
  }

  // Optional: Show loading indicator while processing
  // This could be a full-screen loader or just null
  return null;
};
