import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { telegramAuthService } from '@/services/telegram-auth';
import { logger } from '@/lib/logger';

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

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [platform, setPlatform] = useState<string>('');
  const [initData, setInitData] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  useEffect(() => {
    // Check for development mode - always enable on lovable domains or localhost
    const devMode = window.location.hostname.includes('lovable.dev') ||
                    window.location.hostname.includes('lovable.app') ||
                    window.location.hostname.includes('lovableproject.com') ||
                    window.location.hostname === 'localhost' ||
                    window.location.search.includes('dev=1');
    
    telegramLogger.debug('TelegramProvider initialization started', {
      hostname: window.location.hostname,
      devMode,
      hasTelegram: !!window.Telegram?.WebApp
    });
    
    setIsDevelopmentMode(devMode);

    // Ensure initialization completes even if there are errors
    let initializationTimeout: NodeJS.Timeout;
    
    const ensureInitialized = () => {
      setIsInitialized(true);
      telegramLogger.info('TelegramProvider initialized');
    };

    // Set a safety timeout to prevent infinite loading
    initializationTimeout = setTimeout(() => {
      telegramLogger.warn('Initialization timeout - forcing initialization complete');
      ensureInitialized();
    }, 3000);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);

      telegramLogger.info('Telegram WebApp detected', {
        platform: tg.platform,
        version: tg.version,
        colorScheme: tg.colorScheme
      });

      // Развернуть приложение на весь экран и инициализировать
      tg.ready();
      tg.expand();

      // Lock orientation to portrait mode (vertical only)
      if (typeof (tg as any).lockOrientation === 'function') {
        (tg as any).lockOrientation();
        telegramLogger.debug('Orientation locked to portrait');
      }

      // Request fullscreen mode automatically (Mini App 2.0+)
      if (typeof (tg as any).requestFullscreen === 'function') {
        try {
          (tg as any).requestFullscreen();
          telegramLogger.debug('Fullscreen mode requested');
        } catch (e) {
          telegramLogger.warn('Fullscreen request failed', { error: String(e) });
        }
      }

      // Установка цветов header и background
      if (tg.setHeaderColor) {
        tg.setHeaderColor('secondary_bg_color');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('bg_color');
      }

      if (tg.initDataUnsafe?.user) {
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
        telegramLogger.warn('initDataUnsafe.user not found');
      }

      setPlatform(tg.platform);

      if (tg.initData) {
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
        telegramAuthService.authenticateWithTelegram(tg.initData)
          .then(authData => {
            if (authData) {
              telegramLogger.info('Telegram authentication successful');
            } else {
              telegramLogger.warn('Telegram authentication failed - will retry later');
            }
          })
          .catch(err => {
            // Log error but DO NOT show popup - it blocks initialization
            telegramLogger.error('Telegram authentication error', err);
            // User can retry via profile page or app will auto-retry on next action
          })
          .finally(() => {
            // ALWAYS ensure initialization completes regardless of auth result
            clearTimeout(initializationTimeout);
            ensureInitialized();
          });
      } else {
        telegramLogger.error('InitData not received from Telegram');
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
      const applySafeAreaInsets = () => {
        const isIOS = tg.platform === 'ios';
        const isAndroid = tg.platform === 'android';
        
        telegramLogger.debug('Safe Area setup', { platform: tg.platform });
        
        if (isIOS) {
          root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 44px)');
          root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 34px)');
        } else if (isAndroid) {
          root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 24px)');
          root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
        } else {
          root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
          root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
        }
        
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
      };

      applySafeAreaInsets();

      // Отслеживание изменений viewport и fullscreen для обновления safe areas
      tg.onEvent?.('viewportChanged', applySafeAreaInsets);
      tg.onEvent?.('fullscreenChanged', () => {
        telegramLogger.debug('Fullscreen changed', { isFullscreen: (tg as any).isFullscreen });
        applySafeAreaInsets();
      });
      tg.onEvent?.('safeAreaChanged', applySafeAreaInsets);
      tg.onEvent?.('contentSafeAreaChanged', applySafeAreaInsets);
      
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

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(initializationTimeout);
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
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    if (webApp) {
      webApp.BackButton.hide();
      webApp.BackButton.offClick(() => {});
    }
  };

  const showSettingsButton = (onClick: () => void) => {
    if (webApp && (webApp as any).SettingsButton) {
      (webApp as any).SettingsButton.show();
      (webApp as any).SettingsButton.onClick(onClick);
    }
  };

  const hideSettingsButton = () => {
    if (webApp && (webApp as any).SettingsButton) {
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
  const { webApp } = useTelegram();

  useEffect(() => {
    const startParam = webApp?.initDataUnsafe?.start_param;
    if (!startParam) return;

    telegramLogger.debug('Processing deep link', { startParam });

    // Pattern-based routing for cleaner code
    const routes: [RegExp | string, (match: RegExpMatchArray | null) => string][] = [
      // Content deep links
      [/^track_(.+)$/, (m) => `/library?track=${m![1]}`],
      [/^project_(.+)$/, (m) => `/projects/${m![1]}`],
      [/^artist_(.+)$/, (m) => `/artists/${m![1]}`],
      [/^playlist_(.+)$/, (m) => `/playlists/${m![1]}`],
      [/^album_(.+)$/, (m) => `/album/${m![1]}`],
      [/^blog_(.+)$/, (m) => `/blog/${m![1]}`],
      
      // Generation deep links
      [/^generate_(.+)$/, (m) => `/generate?style=${m![1]}`],
      [/^quick_(.+)$/, (m) => `/generate?style=${m![1]}&quick=true`],
      [/^remix_(.+)$/, (m) => `/generate?remix=${m![1]}`],
      
      // Studio deep links
      [/^studio_ref_(.+)$/, (m) => `/content-hub?tab=cloud&ref=${m![1]}`],
      [/^studio_(.+)$/, (m) => `/studio/${m![1]}`],
      
      // Track views
      [/^lyrics_(.+)$/, (m) => `/library?track=${m![1]}&view=lyrics`],
      [/^stats_(.+)$/, (m) => `/library?track=${m![1]}&view=stats`],
      [/^share_(.+)$/, (m) => `/library?track=${m![1]}`],
      
      // Profile deep links
      [/^user_(.+)$/, (m) => `/profile/${m![1]}`],
      [/^profile_(.+)$/, (m) => `/profile/${m![1]}`],
      
      // Referral deep links
      [/^invite_(.+)$/, (m) => `/?ref=${m![1]}`],
      [/^ref_(.+)$/, (m) => `/?ref=${m![1]}`],
      
      // Simple routes (no capture groups)
      ['buy', () => '/shop'],
      ['credits', () => '/shop'],
      ['subscribe', () => '/shop?tab=subscriptions'],
      ['leaderboard', () => '/leaderboard'],
      ['achievements', () => '/achievements'],
      ['analyze', () => '/?analyze=true'],
      ['recognize', () => '/?recognize=true'],
      ['shazam', () => '/?recognize=true'],
      ['settings', () => '/settings'],
      ['help', () => '/help'],
      ['onboarding', () => '/?onboarding=true'],
      ['library', () => '/library'],
      ['projects', () => '/projects'],
      ['artists', () => '/artists'],
      ['creative', () => '/music-lab'],
      ['musiclab', () => '/music-lab'],
      ['drums', () => '/music-lab?tab=drums'],
      ['dj', () => '/music-lab?tab=dj'],
      ['guitar', () => '/music-lab?tab=guitar'],
      ['melody', () => '/music-lab?tab=melody'],
    ];

    // Try to match routes
    for (const [pattern, getPath] of routes) {
      if (typeof pattern === 'string') {
        if (startParam === pattern) {
          navigate(getPath(null));
          return;
        }
      } else {
        const match = startParam.match(pattern);
        if (match) {
          navigate(getPath(match));
          return;
        }
      }
    }

    // Fallback: unknown deep link, just log it
    telegramLogger.warn('Unknown deep link', { startParam });
  }, [webApp?.initDataUnsafe?.start_param, navigate]);

  return null;
};
