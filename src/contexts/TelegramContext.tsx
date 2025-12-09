import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { telegramAuthService } from '@/services/telegram-auth';
import { logger } from '@/lib/logger';

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
  showMainButton: (text: string, onClick: () => void, options?: { color?: string; textColor?: string; isActive?: boolean; isVisible?: boolean }) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  showSettingsButton: (onClick: () => void) => void;
  hideSettingsButton: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id: string; type: string; text: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => void;
  close: () => void;
  expand: () => void;
  ready: () => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  shareToStory: (mediaUrl: string, options?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
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

        // Seamless authentication with backend
        telegramAuthService.authenticateWithTelegram(tg.initData)
          .then(authData => {
            if (authData) {
              telegramLogger.info('Telegram authentication successful');
            } else {
              telegramLogger.warn('Telegram authentication failed');
            }
          })
          .catch(err => {
            telegramLogger.error('Telegram authentication error', err);
            
            // Use showPopup with retry mechanism for better UX
            if (tg.showPopup) {
              tg.showPopup({
                title: '❌ Ошибка аутентификации',
                message: 'Не удалось войти в систему. Хотите попробовать снова?',
                buttons: [
                  { id: 'retry', type: 'default', text: '🔄 Попробовать снова' },
                  { id: 'cancel', type: 'cancel', text: 'Отмена' },
                ],
              }, (buttonId) => {
                if (buttonId === 'retry') {
                  telegramLogger.debug('Retrying authentication...');
                  telegramAuthService.authenticateWithTelegram(tg.initData)
                    .then(authData => {
                      if (authData) {
                        telegramLogger.info('Retry successful');
                        tg.showPopup?.({
                          message: '✅ Успешно вошли в систему!',
                          buttons: [{ type: 'close' }],
                        });
                      } else {
                        telegramLogger.warn('Retry failed');
                        tg.showPopup?.({
                          message: '❌ Не удалось войти. Пожалуйста, перезапустите приложение.',
                          buttons: [{ type: 'close' }],
                        });
                      }
                    })
                    .catch(retryErr => {
                      telegramLogger.error('Retry failed', retryErr);
                      tg.showPopup?.({
                        message: '❌ Не удалось войти. Пожалуйста, перезапустите приложение.',
                        buttons: [{ type: 'close' }],
                      });
                    });
                }
              });
            } else if (tg.showAlert) {
              // Fallback for older Telegram versions
              tg.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте перезапустить приложение.');
            }
          });
      } else {
        telegramLogger.error('InitData not received from Telegram');
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

      // Отслеживание изменений viewport для обновления safe areas
      tg.onEvent?.('viewportChanged', applySafeAreaInsets);
      
      clearTimeout(initializationTimeout);
      ensureInitialized();
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

  const showMainButton = (text: string, onClick: () => void, options?: { color?: string; textColor?: string; isActive?: boolean; isVisible?: boolean }) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      if (options?.color) webApp.MainButton.color = options.color;
      if (options?.textColor) webApp.MainButton.textColor = options.textColor;
      if (options?.isActive !== undefined) webApp.MainButton.isActive = options.isActive;
      if (options?.isVisible !== undefined) webApp.MainButton.isVisible = options.isVisible;
      webApp.MainButton.show();
      webApp.MainButton.onClick(onClick);
    }
  };

  const hideMainButton = () => {
    if (webApp) {
      webApp.MainButton.hide();
      webApp.MainButton.offClick(() => {});
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
    if (webApp) {
      webApp.enableClosingConfirmation();
    }
  };

  const disableClosingConfirmation = () => {
    if (webApp) {
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
    if (webApp) {
      webApp.openLink(url, options);
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url: string) => {
    if (webApp) {
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

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        platform,
        initData,
        isInitialized,
        isDevelopmentMode,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        showSettingsButton,
        hideSettingsButton,
        enableClosingConfirmation,
        disableClosingConfirmation,
        showPopup,
        showAlert,
        showConfirm,
        hapticFeedback,
        close,
        expand,
        ready,
        openLink,
        openTelegramLink,
        shareToStory,
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
    if (startParam) {
      telegramLogger.debug('Processing deep link', { startParam });
      
      // Track deep links
      if (startParam.startsWith('track_')) {
        const trackId = startParam.replace('track_', '');
        navigate(`/library?track=${trackId}`);
      } 
      // Project deep links
      else if (startParam.startsWith('project_')) {
        const projectId = startParam.replace('project_', '');
        navigate(`/projects/${projectId}`);
      } 
      // Generate with style
      else if (startParam.startsWith('generate_')) {
        const style = startParam.replace('generate_', '');
        navigate(`/generate?style=${style}`);
      }
      // Stem Studio deep link
      else if (startParam.startsWith('studio_')) {
        const trackId = startParam.replace('studio_', '');
        navigate(`/stem-studio/${trackId}`);
      }
      // Remix deep link
      else if (startParam.startsWith('remix_')) {
        const trackId = startParam.replace('remix_', '');
        navigate(`/generate?remix=${trackId}`);
      }
      // Lyrics view deep link
      else if (startParam.startsWith('lyrics_')) {
        const trackId = startParam.replace('lyrics_', '');
        navigate(`/library?track=${trackId}&view=lyrics`);
      }
      // Stats deep link
      else if (startParam.startsWith('stats_')) {
        const trackId = startParam.replace('stats_', '');
        navigate(`/library?track=${trackId}&view=stats`);
      }
      // Share tracking deep link
      else if (startParam.startsWith('share_')) {
        const trackId = startParam.replace('share_', '');
        navigate(`/library?track=${trackId}`);
      }
      // Blog post deep link
      else if (startParam.startsWith('blog_')) {
        const postId = startParam.replace('blog_', '');
        navigate(`/blog/${postId}`);
      }
      // User profile deep link
      else if (startParam.startsWith('user_')) {
        const userId = startParam.replace('user_', '');
        navigate(`/user/${userId}`);
      }
    }
  }, [webApp?.initDataUnsafe?.start_param, navigate]);

  return null;
};
