/**
 * Analyze / recognize deep link handler.
 */
import { handleAnalyzeCommand } from "../../commands/analyze.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

export async function handleAnalyzeDeepLink(chatId: number, userId: number): Promise<void> {
  await handleAnalyzeCommand(chatId, userId, "");
  await trackDeepLinkAnalytics("analyze", "", userId);
}
