/**
 * useOffline - Detect network connectivity status
 * Provides real-time online/offline status for Telegram Mini Apps
 *
 * @example
 * ```tsx
 * const isOffline = useOffline();
 *
 * if (isOffline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Соединение восстановлено', {
        duration: 3000,
        position: 'top-center',
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('Нет подключения к интернету', {
        duration: 5000,
        position: 'top-center',
      });
    };

    // Set initial state
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}

export default useOffline;
