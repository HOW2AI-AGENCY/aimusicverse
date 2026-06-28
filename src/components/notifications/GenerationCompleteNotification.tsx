import { memo } from "react";
import { Music } from "@/lib/icons";
import { NotificationBanner } from "./NotificationBanner";
import type { NotificationItem } from "@/types/notifications";

interface GenerationCompleteNotificationProps {
  trackTitle: string;
  onListenNow: () => void;
  onDismiss: () => void;
}

export function showGenerationComplete(trackTitle: string, onListenNow: () => void): NotificationItem {
  return {
    id: `gen-${Date.now()}`,
    type: "generation-complete",
    title: "Генерация завершена",
    message: `Трек «${trackTitle}» готов к прослушиванию`,
    action: {
      label: "Слушать",
      callback: onListenNow,
      icon: Music,
    },
    timestamp: Date.now(),
    duration: 5000,
    priority: "high",
  };
}
