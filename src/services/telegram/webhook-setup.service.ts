/**
 * Telegram webhook-setup service
 *
 * Thin wrapper around the `telegram-webhook-setup` edge function. Used by the
 * TelegramBotSetup admin card to register the production webhook URL and
 * surface Telegram's `getWebhookInfo` response back to the UI.
 */

import { invokeTelegramWebhookSetup } from "@/api/notifications.api";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "TelegramWebhookSetup" });

export interface TelegramWebhookInfo {
  webhook_url?: string;
  webhook_info?: {
    ok: boolean;
    result?: {
      url?: string;
      pending_update_count?: number;
      last_error_message?: string;
    };
  };
}

export async function setupTelegramWebhook(): Promise<{
  info: TelegramWebhookInfo | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await invokeTelegramWebhookSetup();
    if (error) {
      log.error("Telegram webhook setup failed", { error });
      return { info: null, error: new Error(error.message) };
    }
    return { info: (data as TelegramWebhookInfo | null) ?? null, error: null };
  } catch (err) {
    log.error("Telegram webhook setup threw", err);
    return { info: null, error: err as Error };
  }
}
