import { logger } from "@/lib/logger";

const log = logger.child({ module: "notificationManager" });

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    log.warn("Notifications not supported");
    return "denied";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    log.error("Failed to request notification permission", err);
    return "denied";
  }
}

export function showGenerationCompleteNotification(title: string, body: string): void {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "generation-complete",
      });
    } catch (err) {
      log.error("Failed to show notification", err);
    }
  }
}
