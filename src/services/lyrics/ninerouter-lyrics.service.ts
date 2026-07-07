/**
 * 9Router Lyrics Service
 *
 * Alternative AI lyrics assistant using 9Router gateway.
 * Drop-in replacement for ai-tools.service.ts when 9Router is available.
 */

import { askAI, generateLyrics as generateLyricsAI, MODELS } from "@/services/ninerouter/ninerouter.service";
import { logger } from "@/lib/logger";

const lyricsLogger = logger.child({ module: "NineRouterLyrics" });

// ==========================================
// Types
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

export interface ChatParams {
  message: string;
  context: Record<string, unknown>;
}

// ==========================================
// System Prompts
// ==========================================

const LYRICS_SYSTEM_PROMPT = `You are a professional songwriter and lyricist. 
Write song lyrics based on the given parameters.
Return ONLY the lyrics, no explanations or meta-commentary.
Use proper song structure (verse, chorus, bridge, outro).
Make lyrics emotional, poetic, and singable.`;

const IMPROVE_SYSTEM_PROMPT = `You are a professional lyrics editor.
Improve the given lyrics while maintaining the original meaning and structure.
Focus on: rhyme, rhythm, emotional impact, word choice.
Return ONLY the improved lyrics.`;

const TAGS_SYSTEM_PROMPT = `You are a music structure expert.
Add structure tags [Verse], [Chorus], [Bridge], [Outro] to the given lyrics.
Return ONLY the tagged lyrics.`;

const CHAT_SYSTEM_PROMPT = `You are a creative lyrics assistant.
Help users write, improve, and understand song lyrics.
Be creative, supportive, and knowledgeable about music genres.
Keep responses concise and actionable.`;

// ==========================================
// Service Functions
// ==========================================

export async function generateLyrics(params: GenerateLyricsParams) {
  const prompt = `Generate ${params.language} lyrics:
Theme: ${params.theme}
Genre: ${params.genre}
Mood: ${params.mood}
Structure: ${params.structure}

Write the lyrics:`;

  try {
    const lyrics = await askAI(prompt, MODELS.MIMO_PRO, LYRICS_SYSTEM_PROMPT);
    lyricsLogger.info("Lyrics generated via 9Router");
    return { data: { lyrics }, error: null };
  } catch (err) {
    lyricsLogger.error("9Router lyrics generation failed", err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err };
  }
}

export async function improveLyrics(params: ImproveLyricsParams) {
  const prompt = `Improve these ${params.language} lyrics:

${params.existingLyrics}

Improved version:`;

  try {
    const lyrics = await askAI(prompt, MODELS.MIMO_PRO, IMPROVE_SYSTEM_PROMPT);
    lyricsLogger.info("Lyrics improved via 9Router");
    return { data: { lyrics }, error: null };
  } catch (err) {
    lyricsLogger.error("9Router lyrics improvement failed", err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err };
  }
}

export async function addLyricsTags(params: AddLyricsTagsParams) {
  const prompt = `Add structure tags to these lyrics:

${params.existingLyrics}

Tagged version:`;

  try {
    const lyrics = await askAI(prompt, MODELS.MIMO_PRO, TAGS_SYSTEM_PROMPT);
    lyricsLogger.info("Lyrics tags added via 9Router");
    return { data: { lyrics }, error: null };
  } catch (err) {
    lyricsLogger.error("9Router lyrics tagging failed", err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err };
  }
}

export async function sendAiChatMessage({ message, context }: ChatParams) {
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = contextStr ? `Context:\n${contextStr}\n\nUser: ${message}` : message;

  try {
    const response = await askAI(prompt, MODELS.MIMO_PRO, CHAT_SYSTEM_PROMPT);
    lyricsLogger.info("Chat response from 9Router");
    return { data: { response }, error: null };
  } catch (err) {
    lyricsLogger.error("9Router chat failed", err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err };
  }
}
