/**
 * Notifications API — user notification settings and delivery.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Database } from "@/integrations/supabase/types";

type NotificationSettingsUpdate = Database["public"]["Tables"]["user_notification_settings"]["Update"];

// ==========================================
// Telegram edge-function invocations (C3 Batch B)
// ==========================================

export interface VideoSharePayload {
  type: "video_share";
  trackId: string;
  videoUrl: string;
  title: string;
}

/**
 * Send a video share notification to the user's Telegram chat via the
 * send-telegram-notification edge function.
 */
export async function sendVideoShareNotification(payload: VideoSharePayload): Promise<void> {
  const { error } = await supabase.functions.invoke("send-telegram-notification", { body: payload });
  if (error) throw new Error(error.message);
}

export async function getNotificationSettings(userId: string) {
  const { data, error } = await supabase.from("user_notification_settings").select("*").eq("user_id", userId).single();
  return { data, error };
}

export async function upsertNotificationSettings(data: {
  user_id: string;
  push_enabled?: boolean;
  email_enabled?: boolean;
  generation_complete?: boolean;
  new_follower?: boolean;
  new_comment?: boolean;
  new_like?: boolean;
}) {
  const { error } = await supabase.from("user_notification_settings").upsert(data as never, { onConflict: "user_id" });
  if (error) logger.error("Failed to upsert notification settings", { error: error.message });
  return { error };
}

/**
 * Upsert notification settings used by the onboarding flow.
 * Distinct from {@link upsertNotificationSettings} because the
 * onboarding screen tracks a different set of channels.
 */
export async function upsertOnboardingNotificationSettings(data: {
  user_id: string;
  notify_completed?: boolean;
  notify_likes?: boolean;
  notify_achievements?: boolean;
  notify_daily_reminder?: boolean;
}) {
  const payload: NotificationSettingsUpdate = {
    ...data,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("user_notification_settings")
    .upsert(payload as never, { onConflict: "user_id" });
  if (error) logger.error("Failed to upsert onboarding notification settings", { error: error.message });
  return { error };
}

export async function getNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
  return { error };
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  return { error };
}
