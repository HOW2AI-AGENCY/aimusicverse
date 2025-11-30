import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { telegramAuthService } from '@/services/telegram-auth';

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
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => void;
  close: () => void;
  expand: () => void;
  ready: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

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
    
    console.log('🔍 Development mode check:', {
      hostname: window.location.hostname,
      devMode,
      hasTelegram: !!window.Telegram?.WebApp
    });
    
    setIsDevelopmentMode(devMode);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);

      console.log('🤖 Telegram WebApp обнаружен');
      console.log('📱 Platform:', tg.platform);
      console.log('📊 Version:', tg.version);
      console.log('🎨 Color scheme:', tg.colorScheme);

      // Развернуть приложение на весь экран и инициализировать
      tg.ready();
      tg.expand();

      // Установка цветов header и background
      if (tg.setHeaderColor) {
        tg.setHeaderColor('secondary_bg_color');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('bg_color');
      }

      if (tg.initDataUnsafe?.user) {
        console.log('👤 Telegram пользователь:', {
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
        console.warn('⚠️ initDataUnsafe.user не найден');
      }

      // Handle deep linking
      const startParam = (tg.initDataUnsafe as any)?.start_param;
      if (startParam) {
        console.log('🔗 Deep link detected:', startParam);
        handleDeepLink(startParam);
      }

      setPlatform(tg.platform);

      if (tg.initData) {
        console.log('✅ InitData получен, длина:', tg.initData.length);
        console.log('📄 InitData preview:', tg.initData.substring(0, 100) + '...');

        // Парсим и показываем параметры для диагностики
        const params = new URLSearchParams(tg.initData);
        console.log('🔑 InitData параметры:', {
          hasHash: !!params.get('hash'),
          hasUser: !!params.get('user'),
          hasAuthDate: !!params.get('auth_date'),
          authDate: params.get('auth_date') ? new Date(parseInt(params.get('auth_date')!) * 1000).toISOString() : 'N/A'
        });

        // Seamless authentication with backend
        telegramAuthService.authenticateWithTelegram(tg.initData)
          .then(authData => {
            if (authData) {
              console.log('✅ Telegram authentication successful:', authData.user);
            } else {
              console.warn('⚠️ Telegram authentication failed');
            }
          })
          .catch(err => {
            console.error('❌ Telegram authentication error:', err);
            // TODO: Implement a more robust and user-friendly notification system.
            // Using showAlert for now as a quick solution based on audit feedback.
            if (tg.showAlert) {
              tg.showAlert('Ошибка аутентификации. Пожалуйста, попробуйте перезапустить приложение.');
            }
          });
      } else {
        console.error('❌ InitData не получен от Telegram!');
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
      // Telegram предоставляет safe area через CSS переменные автоматически,
      // но мы также можем установить их явно для совместимости
      const applySafeAreaInsets = () => {
        // Для iOS устройств с notch (44px сверху, 34px снизу)
        // Для Android устройств с punch-hole камерой
        const isIOS = tg.platform === 'ios';
        const isAndroid = tg.platform === 'android';
        
        // Telegram автоматически устанавливает CSS переменные:
        // --tg-safe-area-inset-top, --tg-safe-area-inset-bottom, etc.
        // Мы просто убеждаемся, что они применяются
        
        console.log('📐 Safe Area setup for platform:', tg.platform);
        
        // Установка минимальных safe areas для разных платформ
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
      
      setIsInitialized(true);
    } else if (devMode) {
      // Development mode: Create mock Telegram environment for testing in Lovable
      console.log('🔧 Development mode: Using mock Telegram data');
      
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
      
      // Create mock webApp object
      const mockWebApp = {
        ready: () => console.log('Mock: ready()'),
        expand: () => console.log('Mock: expand()'),
        close: () => console.log('Mock: close()'),
        MainButton: {
          setText: (text: string) => console.log('Mock MainButton:', text),
          show: () => console.log('Mock MainButton: show()'),
          hide: () => console.log('Mock MainButton: hide()'),
          onClick: (fn: () => void) => console.log('Mock MainButton: onClick set'),
          offClick: (fn: () => void) => console.log('Mock MainButton: offClick'),
        },
        BackButton: {
          show: () => console.log('Mock BackButton: show()'),
          hide: () => console.log('Mock BackButton: hide()'),
          onClick: (fn: () => void) => console.log('Mock BackButton: onClick set'),
          offClick: (fn: () => void) => console.log('Mock BackButton: offClick'),
        },
        HapticFeedback: {
          impactOccurred: (type: string) => console.log('Mock Haptic:', type),
          notificationOccurred: (type: string) => console.log('Mock Notification:', type),
          selectionChanged: () => console.log('Mock Selection changed'),
        },
        CloudStorage: {
          setItem: (key: string, value: string, callback?: any) => {
            console.log('Mock CloudStorage.setItem:', key);
            localStorage.setItem(`mock_cloud_${key}`, value);
            callback?.(null, true);
          },
          getItem: (key: string, callback: any) => {
            console.log('Mock CloudStorage.getItem:', key);
            const value = localStorage.getItem(`mock_cloud_${key}`) || '';
            callback(null, value);
          },
          removeItem: (key: string, callback?: any) => {
            console.log('Mock CloudStorage.removeItem:', key);
            localStorage.removeItem(`mock_cloud_${key}`);
            callback?.(null, true);
          },
          getKeys: (callback: any) => {
            console.log('Mock CloudStorage.getKeys');
            const keys = Object.keys(localStorage)
              .filter(k => k.startsWith('mock_cloud_'))
              .map(k => k.replace('mock_cloud_', ''));
            callback(null, keys);
          },
          getItems: (keys: string[], callback: any) => {
            console.log('Mock CloudStorage.getItems:', keys);
            const values: Record<string, string> = {};
            keys.forEach(key => {
              values[key] = localStorage.getItem(`mock_cloud_${key}`) || '';
            });
            callback(null, values);
          },
          removeItems: (keys: string[], callback?: any) => {
            console.log('Mock CloudStorage.removeItems:', keys);
            keys.forEach(key => localStorage.removeItem(`mock_cloud_${key}`));
            callback?.(null, true);
          },
        },
      } as any;
      
      setWebApp(mockWebApp);
      setIsInitialized(true);
    } else {
      // Not in Telegram and not in dev mode
      setIsInitialized(true);
    }
  }, []);

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp) {
      webApp.MainButton.setText(text);
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

  const handleDeepLink = (startParam: string) => {
    console.log('Processing deep link:', startParam);
    
    // Use setTimeout to ensure routing happens after app initialization
    setTimeout(() => {
      if (startParam.startsWith('track_')) {
        const trackId = startParam.replace('track_', '');
        window.location.href = `${window.location.origin}/library?track=${trackId}`;
      } else if (startParam.startsWith('project_')) {
        const projectId = startParam.replace('project_', '');
        window.location.href = `${window.location.origin}/projects/${projectId}`;
      } else if (startParam.startsWith('generate_')) {
        const style = startParam.replace('generate_', '');
        window.location.href = `${window.location.origin}/generate?style=${style}`;
      }
    }, 100);
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
        hapticFeedback,
        close,
        expand,
        ready,
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
