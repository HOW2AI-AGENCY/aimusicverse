import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { mockProfile } from '@/lib/screenshotMockData';
import { Profile } from '@/hooks/useProfile';

interface GuestModeContextType {
  isGuestMode: boolean;
  isScreenshotMode: boolean;
  screenshotProfile: Profile | null;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
  enableScreenshotMode: () => void;
  disableScreenshotMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

const guestLogger = logger.child({ module: 'GuestMode' });

/**
 * Check if we're running in development/preview environment (not in Telegram production)
 */
const isDevEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const hasTelegramWebApp = !!window.Telegram?.WebApp?.initData;
  
  // Development environment = lovable domains OR localhost, AND no real Telegram WebApp
  const isLovableDomain = hostname.includes('lovable.dev') ||
                          hostname.includes('lovable.app') ||
                          hostname.includes('lovableproject.com');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const hasDevParam = window.location.search.includes('dev=1');
  
  return (isLovableDomain || isLocalhost || hasDevParam) && !hasTelegramWebApp;
};

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [isGuestMode, setIsGuestMode] = useState(() => {
    // Auto-enable guest mode in dev environment for seamless preview
    if (isDevEnvironment()) {
      guestLogger.info('Dev environment detected - auto-enabling guest mode');
      return true;
    }
    const saved = localStorage.getItem('guestMode');
    return saved === 'true';
  });

  const [isScreenshotMode, setIsScreenshotMode] = useState(() => {
    // Check URL param on initial load
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('screenshot') === 'true';
    }
    return false;
  });

  // Auto-enable guest mode in dev environment (handles late detection)
  useEffect(() => {
    if (isDevEnvironment() && !isGuestMode) {
      guestLogger.info('Dev environment detected in effect - enabling guest mode');
      setIsGuestMode(true);
    }
  }, [isGuestMode]);

  // Enable screenshot mode via URL param or keyboard shortcut
  useEffect(() => {
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('screenshot') === 'true' && !isScreenshotMode) {
      setIsScreenshotMode(true);
      // Also enable guest mode for route access
      setIsGuestMode(true);
      localStorage.setItem('guestMode', 'true');
      guestLogger.info('Screenshot mode enabled via URL');
    }

    // Keyboard shortcut: Ctrl+Shift+S
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsScreenshotMode(prev => {
          const newValue = !prev;
          guestLogger.info(`Screenshot mode ${newValue ? 'enabled' : 'disabled'} via keyboard`);
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScreenshotMode]);

  // Expose to window for DevTools
  useEffect(() => {
    (window as any).enableScreenshotMode = () => {
      setIsScreenshotMode(true);
      guestLogger.info('Screenshot mode enabled via DevTools');
    };
    (window as any).disableScreenshotMode = () => {
      setIsScreenshotMode(false);
      guestLogger.info('Screenshot mode disabled via DevTools');
    };

    return () => {
      delete (window as any).enableScreenshotMode;
      delete (window as any).disableScreenshotMode;
    };
  }, []);

  const enableGuestMode = () => {
    guestLogger.info('Guest mode enabled');
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
  };

  const disableGuestMode = () => {
    guestLogger.info('Guest mode disabled');
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
  };

  const enableScreenshotMode = () => {
    guestLogger.info('Screenshot mode enabled');
    setIsScreenshotMode(true);
    // Screenshot mode also enables guest mode for route access
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
  };

  const disableScreenshotMode = () => {
    guestLogger.info('Screenshot mode disabled');
    setIsScreenshotMode(false);
    // Remove URL param if present
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('screenshot');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const screenshotProfile = isScreenshotMode ? mockProfile : null;

  return (
    <GuestModeContext.Provider 
      value={{ 
        isGuestMode, 
        isScreenshotMode,
        screenshotProfile,
        enableGuestMode, 
        disableGuestMode,
        enableScreenshotMode,
        disableScreenshotMode,
      }}
    >
      {children}
    </GuestModeContext.Provider>
  );
};

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
};
