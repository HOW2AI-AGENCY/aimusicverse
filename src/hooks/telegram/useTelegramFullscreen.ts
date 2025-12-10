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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isSupported = !!(webApp?.requestFullscreen && webApp?.exitFullscreen);

  const enterFullscreen = useCallback(() => {
    if (!webApp?.requestFullscreen) {
      log.warn('Fullscreen not supported');
      return;
    }

    try {
      webApp.requestFullscreen();
      setIsFullscreen(true);
      log.info('Entered fullscreen mode');
    } catch (error) {
      log.error('Error entering fullscreen', error);
    }
  }, [webApp]);

  const exitFullscreen = useCallback(() => {
    if (!webApp?.exitFullscreen) {
      log.warn('Fullscreen not supported');
      return;
    }

    try {
      webApp.exitFullscreen();
      setIsFullscreen(false);
      log.info('Exited fullscreen mode');
    } catch (error) {
      log.error('Error exiting fullscreen', error);
    }
  }, [webApp]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    if (!webApp) return;

    const handleFullscreenChanged = () => {
      const newState = webApp.isFullscreen || false;
      setIsFullscreen(newState);
      log.debug('Fullscreen state changed', { isFullscreen: newState });
    };

    webApp.onEvent?.('fullscreenChanged', handleFullscreenChanged);

    // Initialize state
    setIsFullscreen(webApp.isFullscreen || false);

    return () => {
      webApp.offEvent?.('fullscreenChanged', handleFullscreenChanged);
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
