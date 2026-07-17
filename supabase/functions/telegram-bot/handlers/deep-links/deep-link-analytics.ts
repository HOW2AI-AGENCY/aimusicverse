/**
 * Deep link analytics tracking.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { logger } from "../../utils/index.ts";
import type { DeepLinkType } from "../../_shared/deeplink-parser.ts";

const supabase = getSupabaseClient();

export async function trackDeepLinkAnalytics(
  type: DeepLinkType,
  value: string,
  userId: number,
  converted: boolean = false,
): Promise<void> {
  try {
    await supabase.from("deeplink_analytics").insert({
      deeplink_type: type,
      deeplink_value: value,
      telegram_user_id: userId,
      source: "telegram_bot",
      converted,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error("Failed to track deep link analytics", error);
  }
}
