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

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [isGuestMode, setIsGuestMode] = useState(() => {
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

  // Enable screenshot mode via URL param or keyboard shortcut
  useEffect(() => {
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('screenshot') === 'true' && !isScreenshotMode) {
      setIsScreenshotMode(true);
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
