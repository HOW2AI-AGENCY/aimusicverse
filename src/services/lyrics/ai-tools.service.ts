/**
 * AI Tools Service
 *
 * Wraps the ai-lyrics-assistant edge function invocations made by the
 * lyrics-workspace AI agent. Replaces direct `supabase.functions.invoke`
 * calls in `useAITools.ts`.
 */

import { invokeLyricsAssistant } from "@/api/lyrics.api";

export interface ExecuteToolParams {
  action: string;
  [key: string]: unknown;
}

export interface ChatParams {
  message: string;
  context: Record<string, unknown>;
}

/**
 * Execute an AI tool via the ai-lyrics-assistant edge function.
 */
export async function executeAiTool(params: ExecuteToolParams) {
  const { data, error } = await invokeLyricsAssistant(params as Parameters<typeof invokeLyricsAssistant>[0]);
  return { data, error };
}

/**
 * Send a free-form chat message to the AI lyrics assistant.
 */
export async function sendAiChatMessage({ message, context }: ChatParams) {
  const { data, error } = await invokeLyricsAssistant({
    action: "chat",
    message,
    context,
  });
  return { data, error };
}
