/**
 * Telegram Actions Hook
 * 
 * Provides all Telegram WebApp action methods.
 * Extracted from TelegramContext.tsx for modularity.
 * 
 * @module contexts/telegram/useTelegramActions
 */

import { useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import type { 
  TelegramWebApp, 
  MainButtonOptions, 
  SecondaryButtonOptions,
  PopupParams,
  HapticType 
} from './types';

const telegramLogger = logger.child({ module: 'TelegramActions' });

/**
 * Hook providing all Telegram WebApp actions
 */
export function useTelegramActions(webApp: TelegramWebApp | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mainButtonCallbackRef = useRef<(() => void) | null>(null);

  // ============ Button Actions ============

  const showMainButton = (text: string, onClick: () => void, options?: MainButtonOptions) => {
    if (webApp?.MainButton) {
      try {
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
      } catch (error) {
        telegramLogger.warn('showMainButton failed', { 
          error: error instanceof Error ? error.message : String(error),
          text 
        });
      }
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      try {
        if (mainButtonCallbackRef.current) {
          webApp.MainButton.offClick(mainButtonCallbackRef.current);
          mainButtonCallbackRef.current = null;
        }
        webApp.MainButton.hide();
        telegramLogger.debug('MainButton hidden');
      } catch (error) {
        telegramLogger.debug('hideMainButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const showSecondaryButton = (text: string, onClick: () => void, options?: SecondaryButtonOptions) => {
    if (webApp?.SecondaryButton) {
      try {
        webApp.SecondaryButton.setText(text);
        if (options?.color) webApp.SecondaryButton.color = options.color;
        if (options?.textColor) webApp.SecondaryButton.textColor = options.textColor;
        if (options?.position) webApp.SecondaryButton.position = options.position;
        webApp.SecondaryButton.show();
        webApp.SecondaryButton.onClick(onClick);
      } catch (error) {
        telegramLogger.debug('showSecondaryButton failed', { 
          error: error instanceof Error ? error.message : String(error),
          text 
        });
      }
    }
  };

  const hideSecondaryButton = () => {
    if (webApp?.SecondaryButton) {
      try {
        webApp.SecondaryButton.hide();
        webApp.SecondaryButton.offClick(() => {});
      } catch (error) {
        telegramLogger.debug('hideSecondaryButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const showBackButton = (onClick: () => void) => {
    if (webApp && webApp.isVersionAtLeast?.('6.1')) {
      try {
        webApp.BackButton.show();
        webApp.BackButton.onClick(onClick);
      } catch (error) {
        telegramLogger.debug('showBackButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const hideBackButton = () => {
    if (webApp && webApp.isVersionAtLeast?.('6.1')) {
      try {
        webApp.BackButton.hide();
        webApp.BackButton.offClick(() => {});
      } catch (error) {
        telegramLogger.debug('hideBackButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const showSettingsButton = (onClick: () => void) => {
    if (webApp && webApp.isVersionAtLeast?.('6.10') && (webApp as any).SettingsButton) {
      try {
        (webApp as any).SettingsButton.show();
        (webApp as any).SettingsButton.onClick(onClick);
      } catch (error) {
        telegramLogger.debug('showSettingsButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const hideSettingsButton = () => {
    if (webApp && webApp.isVersionAtLeast?.('6.10') && (webApp as any).SettingsButton) {
      try {
        (webApp as any).SettingsButton.hide();
        (webApp as any).SettingsButton.offClick(() => {});
      } catch (error) {
        telegramLogger.debug('hideSettingsButton failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  // ============ Dialog Actions ============

  const showPopup = (params: PopupParams, callback?: (buttonId: string) => void) => {
    if (webApp?.showPopup) {
      try {
        webApp.showPopup(params, callback);
      } catch (error) {
        telegramLogger.warn('showPopup failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        alert(params.message);
      }
    }
  };

  const showAlert = (message: string) => {
    if (webApp?.showAlert) {
      try {
        webApp.showAlert(message);
      } catch (error) {
        telegramLogger.warn('showAlert failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        alert(message);
      }
    } else {
      alert(message);
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (webApp?.showConfirm) {
      try {
        webApp.showConfirm(message, callback);
      } catch (error) {
        telegramLogger.warn('showConfirm failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        const confirmed = confirm(message);
        callback?.(confirmed);
      }
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  // ============ Feedback Actions ============

  const hapticFeedback = (type: HapticType) => {
    if (webApp?.HapticFeedback && webApp.isVersionAtLeast?.('6.1')) {
      try {
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
      } catch (error) {
        telegramLogger.debug('hapticFeedback failed', { 
          error: error instanceof Error ? error.message : String(error),
          type 
        });
      }
    }
  };

  // ============ Window Control Actions ============

  const close = () => {
    if (webApp) {
      try {
        webApp.close();
      } catch (error) {
        telegramLogger.warn('close failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const expand = () => {
    if (webApp) {
      try {
        webApp.expand();
      } catch (error) {
        telegramLogger.debug('expand failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const ready = () => {
    if (webApp) {
      try {
        webApp.ready();
      } catch (error) {
        telegramLogger.debug('ready failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const enableClosingConfirmation = () => {
    if (webApp?.enableClosingConfirmation) {
      try {
        webApp.enableClosingConfirmation();
      } catch (error) {
        telegramLogger.debug('enableClosingConfirmation failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const disableClosingConfirmation = () => {
    if (webApp?.disableClosingConfirmation) {
      try {
        webApp.disableClosingConfirmation();
      } catch (error) {
        telegramLogger.debug('disableClosingConfirmation failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  // ============ Fullscreen & Orientation ============

  const requestFullscreen = () => {
    if (webApp?.requestFullscreen) {
      try {
        webApp.requestFullscreen();
        setIsFullscreen(true);
        telegramLogger.info('Requested fullscreen mode');
      } catch (error) {
        telegramLogger.warn('requestFullscreen failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const exitFullscreen = () => {
    if (webApp?.exitFullscreen) {
      try {
        webApp.exitFullscreen();
        setIsFullscreen(false);
        telegramLogger.info('Exited fullscreen mode');
      } catch (error) {
        telegramLogger.warn('exitFullscreen failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const lockOrientation = () => {
    if (webApp?.lockOrientation) {
      try {
        webApp.lockOrientation();
        telegramLogger.info('Orientation locked');
      } catch (error) {
        telegramLogger.debug('lockOrientation failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const unlockOrientation = () => {
    if (webApp?.unlockOrientation) {
      try {
        webApp.unlockOrientation();
        telegramLogger.info('Orientation unlocked');
      } catch (error) {
        telegramLogger.debug('unlockOrientation failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  // ============ Links & Sharing ============

  const openLink = (url: string, options?: { try_instant_view?: boolean }) => {
    if (webApp?.openLink) {
      try {
        (webApp.openLink as (url: string, options?: { try_instant_view?: boolean }) => void)(url, options);
      } catch (error) {
        telegramLogger.warn('openLink failed', { 
          error: error instanceof Error ? error.message : String(error),
          url 
        });
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url: string) => {
    if (webApp?.openTelegramLink) {
      try {
        webApp.openTelegramLink(url);
      } catch (error) {
        telegramLogger.warn('openTelegramLink failed', { 
          error: error instanceof Error ? error.message : String(error),
          url 
        });
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const shareToStory = (mediaUrl: string, options?: { text?: string; widget_link?: { url: string; name?: string } }) => {
    if (webApp && (webApp as any).shareToStory) {
      try {
        (webApp as any).shareToStory(mediaUrl, options);
      } catch (error) {
        telegramLogger.warn('shareToStory failed', { 
          error: error instanceof Error ? error.message : String(error),
          mediaUrl 
        });
      }
    } else {
      telegramLogger.warn('shareToStory not available');
    }
  };

  const shareURL = (url: string, text?: string) => {
    if (webApp?.shareURL) {
      try {
        webApp.shareURL(url, text);
      } catch (error) {
        telegramLogger.warn('shareURL failed', { 
          error: error instanceof Error ? error.message : String(error),
          url 
        });
      }
    } else {
      telegramLogger.warn('shareURL not available');
    }
  };

  // ============ QR Scanner ============

  const showQRScanner = (text?: string, callback?: (data: string) => boolean) => {
    if (webApp?.showScanQrPopup) {
      try {
        webApp.showScanQrPopup({ text: text || 'Scan QR code' }, callback || (() => true));
      } catch (error) {
        telegramLogger.warn('showQRScanner failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    } else {
      telegramLogger.warn('QR Scanner not available');
    }
  };

  const closeQRScanner = () => {
    if (webApp?.closeScanQrPopup) {
      try {
        webApp.closeScanQrPopup();
      } catch (error) {
        telegramLogger.debug('closeQRScanner failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  // ============ Downloads ============

  const downloadFile = (url: string, fileName: string, callback?: (success: boolean) => void) => {
    if (webApp?.downloadFile) {
      try {
        webApp.downloadFile({ url, file_name: fileName }, callback);
      } catch (error) {
        telegramLogger.warn('downloadFile failed', { 
          error: error instanceof Error ? error.message : String(error),
          url,
          fileName 
        });
        callback?.(false);
      }
    } else {
      telegramLogger.warn('downloadFile not available');
      callback?.(false);
    }
  };

  const requestWriteAccess = (callback?: (granted: boolean) => void) => {
    if (webApp?.requestWriteAccess) {
      try {
        webApp.requestWriteAccess(callback);
      } catch (error) {
        telegramLogger.warn('requestWriteAccess failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        callback?.(false);
      }
    } else {
      telegramLogger.warn('requestWriteAccess not available');
      callback?.(false);
    }
  };

  return {
    // State
    isFullscreen,
    
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
    
    // Fullscreen & Orientation
    requestFullscreen,
    exitFullscreen,
    lockOrientation,
    unlockOrientation,
    
    // Links & Sharing
    openLink,
    openTelegramLink,
    shareToStory,
    shareURL,
    
    // QR Scanner
    showQRScanner,
    closeQRScanner,
    
    // Downloads
    downloadFile,
    requestWriteAccess,
  };
}
