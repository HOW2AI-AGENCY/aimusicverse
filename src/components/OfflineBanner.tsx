/**
 * OfflineBanner — shows a persistent banner when the network is offline.
 * Uses useNetworkStatus hook to detect connectivity changes.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNetworkStatus } from "@/hooks/audio/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline && !wasOffline.current) {
      wasOffline.current = true;
      toast.warning("Нет подключения к интернету", {
        description: "Некоторые функции могут быть недоступны",
        duration: Infinity,
        id: "offline-toast",
      });
    } else if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      toast.success("Подключение восстановлено", {
        id: "offline-toast",
        duration: 3000,
      });
    }
  }, [isOnline]);

  return null;
}
