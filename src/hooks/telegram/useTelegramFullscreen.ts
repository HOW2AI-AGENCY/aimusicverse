/**
 * Telegram Fullscreen Hook
 * 
 * Provides fullscreen mode control for Telegram Mini Apps
 * Available in Telegram Mini App 2.0+
 * 
 * Features:
 * - Enter/exit fullscreen mode
 * - Track fullscreen state
 * - Automatic cleanup
 * - Event listeners for fullscreen changes
 * 
 * @example
 * ```tsx
 * const { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen } = useTelegramFullscreen();
 * 
 * <Button onClick={toggleFullscreen}>
 *   {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
 * </Button>
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramFullscreen' });

interface UseTelegramFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
}

export function useTelegramFullscreen(): UseTelegramFullscreenReturn {
  const { webApp } = useTelegram();
  const [isFullscreen, setIsFullscreen] = useState(() => {
    // Initialize from current webApp state
    return (webApp as any)?.isFullscreen || false;
  });

  const isSupported = !!(webApp && typeof (webApp as any).requestFullscreen === 'function');

  const enterFullscreen = useCallback(() => {
    if (!webApp || typeof (webApp as any).requestFullscreen !== 'function') {
      log.warn('Fullscreen not supported');
      return;
    }

    try {
      (webApp as any).requestFullscreen();
      log.info('Entered fullscreen mode');
    } catch (error) {
      log.error('Error entering fullscreen', { error: String(error) });
    }
  }, [webApp]);

  const exitFullscreen = useCallback(() => {
    if (!webApp || typeof (webApp as any).exitFullscreen !== 'function') {
      log.warn('Fullscreen exit not supported');
      return;
    }

    try {
      (webApp as any).exitFullscreen();
      log.info('Exited fullscreen mode');
    } catch (error) {
      log.error('Error exiting fullscreen', { error: String(error) });
    }
  }, [webApp]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen change events and sync state
  useEffect(() => {
    if (!webApp) return;

    const handleFullscreenChanged = () => {
      const newState = (webApp as any).isFullscreen || false;
      setIsFullscreen(newState);
      log.debug('Fullscreen state changed', { isFullscreen: newState });
    };

    // Subscribe to fullscreenChanged event
    if (typeof webApp.onEvent === 'function') {
      webApp.onEvent('fullscreenChanged', handleFullscreenChanged);
    }

    // Initialize state from current webApp
    setIsFullscreen((webApp as any).isFullscreen || false);

    return () => {
      if (typeof webApp.offEvent === 'function') {
        webApp.offEvent('fullscreenChanged', handleFullscreenChanged);
      }
    };
  }, [webApp]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
