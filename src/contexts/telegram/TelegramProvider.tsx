/**
 * Telegram Provider Component
 * 
 * Main provider component for Telegram Mini App integration.
 * Uses modular hooks for initialization and actions.
 * 
 * @module contexts/telegram/TelegramProvider
 */

import { createContext, useContext, ReactNode } from 'react';
import { useTelegramInit } from './useTelegramInit';
import { useTelegramActions } from './useTelegramActions';
import type { TelegramContextType } from './types';

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const {
    webApp,
    user,
    platform,
    initData,
    isInitialized,
    isDevelopmentMode,
  } = useTelegramInit();

  const actions = useTelegramActions(webApp);

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
        showMainButton: actions.showMainButton,
        hideMainButton: actions.hideMainButton,
        showSecondaryButton: actions.showSecondaryButton,
        hideSecondaryButton: actions.hideSecondaryButton,
        showBackButton: actions.showBackButton,
        hideBackButton: actions.hideBackButton,
        showSettingsButton: actions.showSettingsButton,
        hideSettingsButton: actions.hideSettingsButton,
        
        // Dialogs
        showPopup: actions.showPopup,
        showAlert: actions.showAlert,
        showConfirm: actions.showConfirm,
        
        // Feedback
        hapticFeedback: actions.hapticFeedback,
        
        // Window control
        close: actions.close,
        expand: actions.expand,
        ready: actions.ready,
        enableClosingConfirmation: actions.enableClosingConfirmation,
        disableClosingConfirmation: actions.disableClosingConfirmation,
        
        // Fullscreen
        requestFullscreen: actions.requestFullscreen,
        exitFullscreen: actions.exitFullscreen,
        isFullscreen: actions.isFullscreen,
        
        // Orientation
        lockOrientation: actions.lockOrientation,
        unlockOrientation: actions.unlockOrientation,
        
        // Links
        openLink: actions.openLink,
        openTelegramLink: actions.openTelegramLink,
        
        // Sharing
        shareToStory: actions.shareToStory,
        shareURL: actions.shareURL,
        
        // QR Scanner
        showQRScanner: actions.showQRScanner,
        closeQRScanner: actions.closeQRScanner,
        
        // Downloads
        downloadFile: actions.downloadFile,
        requestWriteAccess: actions.requestWriteAccess,
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
