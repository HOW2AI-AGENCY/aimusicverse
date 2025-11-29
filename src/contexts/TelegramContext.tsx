import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramContextType {
  webApp: typeof window.Telegram.WebApp | null;
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
  const [webApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(null);
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
      
      tg.ready();
      tg.expand();
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user as TelegramUser);
      }
      
      setPlatform(tg.platform);
      setInitData(tg.initData);

      // Apply Telegram theme colors to CSS variables
      const themeParams = tg.themeParams;
      if (themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
      }
      if (themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
      }
      if (themeParams.button_color) {
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
      }
      if (themeParams.button_text_color) {
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
      }
      
      setIsInitialized(true);
    } else if (devMode) {
      // Development mode: Create mock Telegram environment for testing in Lovable
      console.log('🔧 Development mode: Using mock Telegram data');
      
      const mockUser: TelegramUser = {
        id: 123456789,
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
