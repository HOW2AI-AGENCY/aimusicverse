/**
 * AI Tools Service
 *
 * Wraps the ai-lyrics-assistant edge function invocations made by the
 * lyrics-workspace AI agent and the InlineLyricsEditor. Replaces direct
 * `supabase.functions.invoke` calls in `useAITools.ts` and
 * `InlineLyricsEditor.tsx`.
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

// ==========================================
// InlineLyricsEditor
// ==========================================

export interface GenerateLyricsParams {
  theme: string;
  genre: string;
  mood: string;
  structure: string;
  language: string;
}

export interface ImproveLyricsParams {
  existingLyrics: string;
  language: string;
}

export interface AddLyricsTagsParams {
  existingLyrics: string;
}

/**
 * Generate fresh lyrics from theme / genre / mood / structure.
 */
export async function generateLyrics(params: GenerateLyricsParams) {
  return invokeLyricsAssistant({
    action: "generate",
    theme: params.theme,
    genre: params.genre,
    mood: params.mood,
    structure: params.structure,
    language: params.language,
  });
}

/**
 * Improve existing lyrics via the AI lyrics assistant.
 */
export async function improveLyrics(params: ImproveLyricsParams) {
  return invokeLyricsAssistant({
    action: "improve",
    lyrics: params.existingLyrics,
    language: params.language,
  });
}

/**
 * Add [Verse]/[Chorus] style tags to existing lyrics.
 */
export async function addLyricsTags(params: AddLyricsTagsParams) {
  return invokeLyricsAssistant({
    action: "add_tags",
    lyrics: params.existingLyrics,
  });
}
