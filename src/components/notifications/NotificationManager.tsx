/* eslint-disable react-refresh/only-export-components */
import { memo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { NotificationBanner } from "./NotificationBanner";
import type { NotificationItem } from "@/types/notifications";

interface NotificationManagerProps {
  className?: string;
}

const MAX_VISIBLE = 3;

export const NotificationManager = memo(function NotificationManager({ className }: NotificationManagerProps) {
  const [pending, setPending] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setPending((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const show = useCallback(
    (notification: Omit<NotificationItem, "id" | "timestamp"> & { id?: string }) => {
      const item: NotificationItem = {
        ...notification,
        id: notification.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      setPending((prev) => [item, ...prev].slice(0, MAX_VISIBLE * 2));

      if (notification.duration) {
        setTimeout(() => dismiss(item.id), notification.duration);
      }
    },
    [dismiss],
  );

  const dismissAll = useCallback(() => {
    setPending([]);
  }, []);

  const onAction = useCallback(
    (id: string) => {
      const item = pending.find((n) => n.id === id);
      item?.action?.callback();
      dismiss(id);
    },
    [pending, dismiss],
  );

  const visible = pending.slice(0, MAX_VISIBLE);

  return (
    <div className={className}>
      <AnimatePresence>
        {visible.map((item) => (
          <div key={item.id} className="mb-2 last:mb-0">
            <NotificationBanner notification={item} onDismiss={dismiss} onAction={onAction} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export function useNotificationManager() {
  // Global single-instance ref pattern
  const managerRef =
    typeof window !== "undefined"
      ? (window as unknown as Record<string, { show: (n: Omit<NotificationItem, "id" | "timestamp">) => void }>)
      : null;

  const show = useCallback(
    (notification: Omit<NotificationItem, "id" | "timestamp">) => {
      const mgr = managerRef?.["__notificationManager"];
      mgr?.show?.(notification);
    },
    [managerRef],
  );

  return { show };
}
