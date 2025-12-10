/**
 * Telegram QR Scanner Hook
 * 
 * Provides QR code scanning functionality
 * Available in Telegram 6.4+
 * 
 * Features:
 * - Open native QR scanner
 * - Custom scan text
 * - Validation callback
 * - Auto-close on success
 * 
 * @example
 * ```tsx
 * const { scanQR, isScanning, isSupported } = useTelegramQRScanner();
 * 
 * const handleScan = async () => {
 *   const result = await scanQR('Scan track QR code');
 *   if (result) {
 *     console.log('Scanned:', result);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramQRScanner' });

interface UseTelegramQRScannerReturn {
  isScanning: boolean;
  isSupported: boolean;
  scanQR: (text?: string, validate?: (data: string) => boolean) => Promise<string | null>;
  closeScanner: () => void;
}

export function useTelegramQRScanner(): UseTelegramQRScannerReturn {
  const { webApp } = useTelegram();
  const [isScanning, setIsScanning] = useState(false);

  const isSupported = !!(webApp?.showScanQrPopup && webApp?.closeScanQrPopup);

  const closeScanner = useCallback(() => {
    if (!webApp?.closeScanQrPopup) {
      log.warn('QR Scanner not supported');
      return;
    }

    try {
      webApp.closeScanQrPopup();
      setIsScanning(false);
      log.info('QR Scanner closed');
    } catch (error) {
      log.error('Error closing QR scanner', error);
    }
  }, [webApp]);

  const scanQR = useCallback(
    (text?: string, validate?: (data: string) => boolean): Promise<string | null> => {
      if (!webApp?.showScanQrPopup) {
        log.warn('QR Scanner not supported');
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        let resolved = false;

        try {
          setIsScanning(true);

          webApp.showScanQrPopup!(
            { text: text || 'Отсканируйте QR-код' },
            (data) => {
              // Validation callback - return true to close scanner
              if (validate) {
                const isValid = validate(data);
                if (isValid) {
                  if (!resolved) {
                    resolved = true;
                    setIsScanning(false);
                    log.info('QR scanned and validated', { data });
                    resolve(data);
                  }
                  return true; // Close scanner
                }
                return false; // Keep scanner open
              }

              // No validation - accept any scan
              if (!resolved) {
                resolved = true;
                setIsScanning(false);
                log.info('QR scanned', { data });
                resolve(data);
              }
              return true; // Close scanner
            }
          );

          // Handle scanner cancellation (after 30 seconds timeout or manual close)
          setTimeout(() => {
            if (!resolved && isScanning) {
              resolved = true;
              setIsScanning(false);
              log.info('QR scan cancelled or timed out');
              resolve(null);
            }
          }, 31000);
        } catch (error) {
          log.error('Error showing QR scanner', error);
          setIsScanning(false);
          resolve(null);
        }
      });
    },
    [webApp, isScanning]
  );

  return {
    isScanning,
    isSupported,
    scanQR,
    closeScanner,
  };
}
