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
  /** True if the last fullscreen request failed */
  isFullscreenFailed: boolean;
  /** Error message from failed fullscreen request */
  fullscreenError: string | null;
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
  const [isFullscreenFailed, setIsFullscreenFailed] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const isSupported = !!(webApp && typeof (webApp as any).requestFullscreen === 'function');

  const enterFullscreen = useCallback(() => {
    if (!webApp || typeof (webApp as any).requestFullscreen !== 'function') {
      log.warn('Fullscreen not supported');
      return;
    }

    // Reset error state before attempting
    setIsFullscreenFailed(false);
    setFullscreenError(null);

    try {
      (webApp as any).requestFullscreen();
      log.info('Requested fullscreen mode');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setIsFullscreenFailed(true);
      setFullscreenError(errorMsg);
      log.error('Error entering fullscreen', { error: errorMsg });
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

  // Listen for fullscreen change and failed events
  useEffect(() => {
    if (!webApp) return;

    const handleFullscreenChanged = () => {
      const newState = (webApp as any).isFullscreen || false;
      setIsFullscreen(newState);
      // Clear error state on successful change
      if (newState) {
        setIsFullscreenFailed(false);
        setFullscreenError(null);
      }
      log.debug('Fullscreen state changed', { isFullscreen: newState });
    };

    // Handle fullscreen failed event (Mini App 2.0+)
    const handleFullscreenFailed = (event: { error?: string } | undefined) => {
      setIsFullscreenFailed(true);
      const errorMsg = event?.error || 'Unknown fullscreen error';
      setFullscreenError(errorMsg);
      log.warn('Fullscreen request failed', { error: errorMsg });
    };

    // Subscribe to events
    if (typeof webApp.onEvent === 'function') {
      webApp.onEvent('fullscreenChanged', handleFullscreenChanged);
      webApp.onEvent('fullscreenFailed', handleFullscreenFailed);
    }

    // Initialize state from current webApp
    setIsFullscreen((webApp as any).isFullscreen || false);

    return () => {
      if (typeof webApp.offEvent === 'function') {
        webApp.offEvent('fullscreenChanged', handleFullscreenChanged);
        webApp.offEvent('fullscreenFailed', handleFullscreenFailed);
      }
    };
  }, [webApp]);

  return {
    isFullscreen,
    isSupported,
    isFullscreenFailed,
    fullscreenError,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
