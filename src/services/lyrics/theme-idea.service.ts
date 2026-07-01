/**
 * Theme Idea Service
 *
 * Wraps `invokeLyricsAssistant` from `@/api/lyrics.api`. Used by the
 * ConceptStep in the lyrics wizard to suggest a song theme.
 */

import { invokeLyricsAssistant } from "@/api/lyrics.api";

export interface GenerateThemeIdeaParams {
  genre: string;
  mood: string;
  language: string;
  prompt?: string;
}

export async function generateThemeIdea(params: GenerateThemeIdeaParams): Promise<string | null> {
  const { data, error } = await invokeLyricsAssistant({
    action: "generate",
    genre: params.genre,
    mood: params.mood,
    language: params.language,
    theme: params.prompt ?? "предложи одну интересную тему для песни в 1-2 предложениях",
  });

  if (error) throw error;
  if (data?.lyrics) return data.lyrics.trim();
  return null;
}
