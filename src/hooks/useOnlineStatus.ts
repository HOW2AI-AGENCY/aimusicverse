/**
 * useOnlineStatus - Track browser online/offline connectivity
 *
 * Uses navigator.onLine for initial state and listens to
 * window 'online' / 'offline' events for real-time updates.
 *
 * @example
 * ```tsx
 * const { isOnline } = useOnlineStatus();
 * if (!isOnline) return <OfflineBanner />;
 * ```
 */

import { useState, useEffect } from "react";

export function useOnlineStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
