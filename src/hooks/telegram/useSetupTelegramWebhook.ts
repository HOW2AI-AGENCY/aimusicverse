/**
 * useSetupTelegramWebhook - Mutation hook for invoking the telegram-webhook-setup edge function.
 *
 * Used by TelegramBotSetup admin card to configure the production webhook URL.
 */

import { useMutation } from "@tanstack/react-query";
import { setupTelegramWebhook, type TelegramWebhookInfo } from "@/services/telegram/webhook-setup.service";

export function useSetupTelegramWebhook() {
  return useMutation<{ info: TelegramWebhookInfo | null; error: Error | null }, Error, void>({
    mutationFn: () => setupTelegramWebhook(),
  });
}
