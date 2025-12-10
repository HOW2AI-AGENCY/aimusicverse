import { createContext, useContext, useState, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface GuestModeContextType {
  isGuestMode: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

const guestLogger = logger.child({ module: 'GuestMode' });

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [isGuestMode, setIsGuestMode] = useState(() => {
    // Check localStorage for saved guest mode preference
    const saved = localStorage.getItem('guestMode');
    return saved === 'true';
  });

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

  return (
    <GuestModeContext.Provider value={{ isGuestMode, enableGuestMode, disableGuestMode }}>
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
