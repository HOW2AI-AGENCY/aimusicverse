import type { LyricsAction } from "./types.ts";
import { buildBaseSystemPrompt } from "./prompts/base.ts";
import { systemPrompts as genSys, userPrompts as genUser } from "./prompts/generation.ts";
import { systemPrompts as analysisSys, userPrompts as analysisUser } from "./prompts/analysis.ts";
import { systemPrompts as structSys, userPrompts as structUser } from "./prompts/structure.ts";
import { systemPrompts as creatSys, userPrompts as creatUser } from "./prompts/creativity.ts";
import { systemPrompts as styleSys, userPrompts as styleUser } from "./prompts/style-prompts.ts";
import { systemPrompts as chatSys, userPrompts as chatUser } from "./prompts/chat.ts";

const allSystemPrompts = { ...genSys, ...analysisSys, ...structSys, ...creatSys, ...styleSys, ...chatSys };
const allUserPrompts = { ...genUser, ...analysisUser, ...structUser, ...creatUser, ...styleUser, ...chatUser };

export function buildSystemPrompt(
  action: LyricsAction,
  basePrompt: string,
  body: {
    language?: string;
    targetStyle?: string;
    targetLanguage?: string;
    targetTone?: string;
    preserveSyllables?: boolean;
    context?: any;
    genre?: string;
    mood?: string;
  },
): string {
  const { language = "ru" } = body;
  const bodyWithLang = { ...body, language };

  // Actions that use the base prompt plus a suffix
  const needsBasePrompt: LyricsAction[] = ["generate_section", "continue_line", "analyze_lyrics", "optimize_for_suno"];
  if (needsBasePrompt.includes(action)) {
    const fn = allSystemPrompts[action];
    return fn ? fn(basePrompt, bodyWithLang) : basePrompt;
  }

  const fn = allSystemPrompts[action];
  return fn ? fn(basePrompt, bodyWithLang) : basePrompt;
}

export function buildUserPrompt(action: LyricsAction, body: any): string {
  const fn = allUserPrompts[action];
  return fn ? fn(body) : "";
}

// Re-export for index.ts
export { buildBaseSystemPrompt } from "./prompts/base.ts";
