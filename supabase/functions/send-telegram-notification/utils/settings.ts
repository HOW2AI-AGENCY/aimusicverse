import { createLogger } from "../../_shared/logger.ts";
import type { NotificationSettings } from "../types.ts";

const logger = createLogger("send-telegram-notification");

/**
 * Check if notification should be sent based on user settings
 */
export async function canSendNotification(
  supabase: any,
  userId: string | undefined,
  chatId: number,
  notificationType: string,
): Promise<boolean> {
  try {
    let settings: NotificationSettings | null = null;

    if (userId) {
      const { data } = await supabase
        .from("user_notification_settings")
        .select("notify_completed, notify_failed, notify_progress, notify_stem_ready")
        .eq("user_id", userId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) {
      const { data } = await supabase
        .from("user_notification_settings")
        .select("notify_completed, notify_failed, notify_progress, notify_stem_ready")
        .eq("telegram_chat_id", chatId)
        .single();
      settings = data as NotificationSettings | null;
    }

    if (!settings) return true;

    switch (notificationType) {
      case "completed":
      case "generation_complete":
        return settings.notify_completed !== false;
      case "failed":
        return settings.notify_failed !== false;
      case "progress":
        return settings.notify_progress === true;
      case "stem_ready":
        return settings.notify_stem_ready !== false;
      default:
        return true;
    }
  } catch {
    return true;
  }
}

/**
 * Get chat_id for a user
 */
export async function getChatIdForUser(supabase: any, userId: string): Promise<number | null> {
  try {
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("telegram_chat_id")
      .eq("user_id", userId)
      .single();

    if (settings?.telegram_chat_id) {
      return settings.telegram_chat_id as number;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_chat_id, telegram_id")
      .eq("user_id", userId)
      .single();

    return (profile?.telegram_chat_id || profile?.telegram_id || null) as number | null;
  } catch {
    return null;
  }
}
