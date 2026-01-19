/**
 * Telegram Orientation Lock Hook
 * 
 * Automatically locks orientation when component mounts (e.g., Studio)
 * and unlocks when unmounting.
 * 
 * @example
 * ```tsx
 * // In Studio component
 * useTelegramOrientationLock({ lockOnMount: true });
 * ```
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramOrientationLock' });

interface UseTelegramOrientationLockOptions {
  /** Lock orientation when component mounts */
  lockOnMount?: boolean;
  /** Unlock orientation when component unmounts */
  unlockOnUnmount?: boolean;
}

interface UseTelegramOrientationLockReturn {
  /** Whether orientation lock is supported */
  isSupported: boolean;
  /** Whether orientation is currently locked */
  isLocked: boolean;
  /** Lock orientation to current position */
  lock: () => void;
  /** Unlock orientation */
  unlock: () => void;
  /** Toggle orientation lock */
  toggle: () => void;
}

export function useTelegramOrientationLock(
  options: UseTelegramOrientationLockOptions = {}
): UseTelegramOrientationLockReturn {
  const { lockOnMount = false, unlockOnUnmount = true } = options;
  const { webApp } = useTelegram();
  const [isLocked, setIsLocked] = useState(false);
  
  // Track if we locked orientation (to properly unlock on unmount)
  const didLockRef = useRef(false);

  const isSupported = !!(webApp && typeof (webApp as any).lockOrientation === 'function');

  const lock = useCallback(() => {
    if (!webApp || typeof (webApp as any).lockOrientation !== 'function') {
      log.debug('Orientation lock not supported');
      return;
    }

    try {
      (webApp as any).lockOrientation();
      setIsLocked(true);
      didLockRef.current = true;
      log.info('Orientation locked');
    } catch (error) {
      log.warn('Failed to lock orientation', { error: String(error) });
    }
  }, [webApp]);

  const unlock = useCallback(() => {
    if (!webApp || typeof (webApp as any).unlockOrientation !== 'function') {
      log.debug('Orientation unlock not supported');
      return;
    }

    try {
      (webApp as any).unlockOrientation();
      setIsLocked(false);
      didLockRef.current = false;
      log.info('Orientation unlocked');
    } catch (error) {
      log.warn('Failed to unlock orientation', { error: String(error) });
    }
  }, [webApp]);

  const toggle = useCallback(() => {
    if (isLocked) {
      unlock();
    } else {
      lock();
    }
  }, [isLocked, lock, unlock]);

  // Auto lock on mount
  useEffect(() => {
    if (lockOnMount && isSupported) {
      lock();
    }
  }, [lockOnMount, isSupported, lock]);

  // Cleanup: unlock on unmount using ref to avoid stale closure
  useEffect(() => {
    return () => {
      if (unlockOnUnmount && didLockRef.current && webApp) {
        try {
          (webApp as any).unlockOrientation?.();
          log.info('Orientation unlocked on unmount');
        } catch (error) {
          log.warn('Failed to unlock orientation on unmount', { error: String(error) });
        }
      }
    };
  }, [unlockOnUnmount, webApp]);

  return {
    isSupported,
    isLocked,
    lock,
    unlock,
    toggle,
  };
}
