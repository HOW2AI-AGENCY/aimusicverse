/**
 * Notifications API — user notification settings and delivery.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

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
