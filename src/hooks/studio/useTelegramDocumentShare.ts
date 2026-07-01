/**
 * useTelegramDocumentShare - Mutation hook for sharing a document via Telegram bot.
 *
 * Used by MidiFilesCard and UnifiedNotesViewer to send transcription files
 * to the user's Telegram chat via the send-telegram-notification edge function.
 */

import { useMutation } from "@tanstack/react-query";
import { sendTelegramDocumentShare, type TelegramDocumentSharePayload } from "@/services/studio.service";

export function useTelegramDocumentShare() {
  return useMutation<{ error: Error | null }, Error, TelegramDocumentSharePayload>({
    mutationFn: (input) => sendTelegramDocumentShare(input),
  });
}
