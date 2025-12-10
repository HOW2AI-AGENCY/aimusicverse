/**
 * Telegram Biometric Authentication Hook
 * 
 * Provides biometric authentication (Touch ID, Face ID, fingerprint)
 * Available in Telegram 7.2+ on iOS and Android
 * 
 * Features:
 * - Check biometric availability
 * - Request biometric access
 * - Authenticate with biometrics
 * - Token management for secure storage
 * 
 * @example
 * ```tsx
 * const { authenticate, isAvailable, biometricType } = useTelegramBiometric();
 * 
 * const handleSecureAction = async () => {
 *   const success = await authenticate('Confirm track purchase');
 *   if (success) {
 *     // Proceed with action
 *   }
 * };
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramBiometric' });

interface UseTelegramBiometricReturn {
  // Status
  isSupported: boolean;
  isAvailable: boolean;
  isAccessGranted: boolean;
  biometricType: 'finger' | 'face' | 'unknown' | null;
  deviceId: string | null;
  
  // Methods
  initialize: () => Promise<boolean>;
  requestAccess: (reason?: string) => Promise<boolean>;
  authenticate: (reason?: string) => Promise<{ success: boolean; token?: string }>;
  updateToken: (token: string) => Promise<boolean>;
  openSettings: () => void;
}

export function useTelegramBiometric(): UseTelegramBiometricReturn {
  const { webApp } = useTelegram();
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [biometricType, setBiometricType] = useState<'finger' | 'face' | 'unknown' | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isSupported = !!webApp?.BiometricManager;

  // Initialize biometric manager
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!webApp?.BiometricManager) {
      log.warn('BiometricManager not supported');
      return false;
    }

    if (isInitialized) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        webApp.BiometricManager!.init(() => {
          const manager = webApp.BiometricManager!;
          
          setIsAvailable(manager.isBiometricAvailable);
          setIsAccessGranted(manager.isAccessGranted);
          setBiometricType(manager.biometricType);
          setDeviceId(manager.deviceId);
          setIsInitialized(true);
          
          log.info('BiometricManager initialized', {
            available: manager.isBiometricAvailable,
            type: manager.biometricType,
            accessGranted: manager.isAccessGranted,
          });
          
          resolve(true);
        });
      } catch (error) {
        log.error('Error initializing BiometricManager', error);
        resolve(false);
      }
    });
  }, [webApp, isInitialized]);

  // Request biometric access
  const requestAccess = useCallback(async (reason?: string): Promise<boolean> => {
    if (!webApp?.BiometricManager) {
      log.warn('BiometricManager not supported');
      return false;
    }

    if (!isInitialized) {
      await initialize();
    }

    return new Promise((resolve) => {
      try {
        webApp.BiometricManager!.requestAccess(
          { reason: reason || 'Для безопасного доступа к приложению' },
          (granted) => {
            setIsAccessGranted(granted);
            log.info('Biometric access request result', { granted });
            resolve(granted);
          }
        );
      } catch (error) {
        log.error('Error requesting biometric access', error);
        resolve(false);
      }
    });
  }, [webApp, isInitialized, initialize]);

  // Authenticate with biometrics
  const authenticate = useCallback(async (
    reason?: string
  ): Promise<{ success: boolean; token?: string }> => {
    if (!webApp?.BiometricManager) {
      log.warn('BiometricManager not supported');
      return { success: false };
    }

    if (!isInitialized) {
      await initialize();
    }

    if (!isAccessGranted) {
      const granted = await requestAccess(reason);
      if (!granted) {
        return { success: false };
      }
    }

    return new Promise((resolve) => {
      try {
        webApp.BiometricManager!.authenticate(
          { reason: reason || 'Подтвердите действие' },
          (success, token) => {
            log.info('Biometric authentication result', { success });
            resolve({ success, token });
          }
        );
      } catch (error) {
        log.error('Error during biometric authentication', error);
        resolve({ success: false });
      }
    });
  }, [webApp, isInitialized, isAccessGranted, initialize, requestAccess]);

  // Update biometric token
  const updateToken = useCallback(async (token: string): Promise<boolean> => {
    if (!webApp?.BiometricManager) {
      log.warn('BiometricManager not supported');
      return false;
    }

    return new Promise((resolve) => {
      try {
        webApp.BiometricManager!.updateBiometricToken(token, (success) => {
          log.info('Biometric token update result', { success });
          resolve(success);
        });
      } catch (error) {
        log.error('Error updating biometric token', error);
        resolve(false);
      }
    });
  }, [webApp]);

  // Open biometric settings
  const openSettings = useCallback(() => {
    if (!webApp?.BiometricManager) {
      log.warn('BiometricManager not supported');
      return;
    }

    try {
      webApp.BiometricManager.openSettings();
      log.info('Opened biometric settings');
    } catch (error) {
      log.error('Error opening biometric settings', error);
    }
  }, [webApp]);

  // Auto-initialize on mount
  useEffect(() => {
    if (isSupported && !isInitialized) {
      initialize();
    }
  }, [isSupported, isInitialized, initialize]);

  return {
    isSupported,
    isAvailable,
    isAccessGranted,
    biometricType,
    deviceId,
    initialize,
    requestAccess,
    authenticate,
    updateToken,
    openSettings,
  };
}
