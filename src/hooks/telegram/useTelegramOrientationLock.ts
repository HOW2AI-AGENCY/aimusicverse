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

import { useEffect, useCallback, useState } from 'react';
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

  const isSupported = !!(webApp && typeof (webApp as any).lockOrientation === 'function');

  const lock = useCallback(() => {
    if (!webApp || typeof (webApp as any).lockOrientation !== 'function') {
      log.debug('Orientation lock not supported');
      return;
    }

    try {
      (webApp as any).lockOrientation();
      setIsLocked(true);
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

  // Auto lock/unlock on mount/unmount
  useEffect(() => {
    if (lockOnMount && isSupported) {
      lock();
    }

    return () => {
      if (unlockOnUnmount && isLocked) {
        unlock();
      }
    };
  }, [lockOnMount, unlockOnUnmount, isSupported]);

  return {
    isSupported,
    isLocked,
    lock,
    unlock,
    toggle,
  };
}
