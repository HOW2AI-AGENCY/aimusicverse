/**
 * lyricsSectionMeta - Shared metadata for lyrics section types.
 *
 * Single source of truth for the generation-form lyrics editors:
 * LyricsVisualEditorCompact (visual mode), LyricsPreview (preview mode)
 * and the text-mode templates all describe sections through this module,
 * so labels, glyphs and colors stay in sync across the three views.
 *
 * Colors come from the design system (`sectionColors` in design-colors.ts).
 */

import { getSectionColor } from "@/lib/design-colors";

export type LyricSectionType =
  "intro" | "verse" | "pre" | "chorus" | "hook" | "bridge" | "drop" | "breakdown" | "outro";

export interface LyricSectionDef {
  value: LyricSectionType;
  /** Human label shown in the UI (Russian). */
  label: string;
  /** Single-letter marker used in timelines and type chips. */
  glyph: string;
  /** Canonical Suno-style header emitted into the lyrics text, e.g. [Pre-Chorus]. */
  header: string;
}

/** 9 structural sections, ordered from cold-open to fade-out. */
export const LYRIC_SECTION_TYPES: LyricSectionDef[] = [
  { value: "intro", label: "Интро", glyph: "I", header: "Intro" },
  { value: "verse", label: "Куплет", glyph: "V", header: "Verse" },
  { value: "pre", label: "Пре-припев", glyph: "P", header: "Pre-Chorus" },
  { value: "chorus", label: "Припев", glyph: "C", header: "Chorus" },
  { value: "hook", label: "Хук", glyph: "H", header: "Hook" },
  { value: "bridge", label: "Бридж", glyph: "B", header: "Bridge" },
  { value: "drop", label: "Дроп", glyph: "D", header: "Drop" },
  { value: "breakdown", label: "Брейкдаун", glyph: "X", header: "Breakdown" },
  { value: "outro", label: "Аутро", glyph: "O", header: "Outro" },
];

export const LYRIC_SECTION_BY_VALUE: Record<LyricSectionType, LyricSectionDef> = LYRIC_SECTION_TYPES.reduce(
  (acc, def) => {
    acc[def.value] = def;
    return acc;
  },
  {} as Record<LyricSectionType, LyricSectionDef>,
);

/** Russian header aliases, so `[Куплет 2]` in text mode parses like `[Verse 2]`. */
const RU_ALIASES: Record<string, LyricSectionType> = {
  куплет: "verse",
  припев: "chorus",
  интро: "intro",
  вступление: "intro",
  аутро: "outro",
  концовка: "outro",
  бридж: "bridge",
  хук: "hook",
  дроп: "drop",
  преприпев: "pre",
  предприпев: "pre",
  брейкдаун: "breakdown",
};

/**
 * Normalize a raw header token (from `[Verse 2]`, `[pre-chorus]`, `[PreChorus]`,
 * `[Куплет]`…) to a structural section type, or null when the token is not one
 * of the 9 types.
 */
export function normalizeSectionType(raw: string): LyricSectionType | null {
  const key = raw.toLowerCase().replace(/[\s_-]/g, "");
  if (key.startsWith("prechorus") || key === "pre") return "pre";
  if (RU_ALIASES[key]) return RU_ALIASES[key];
  const found = LYRIC_SECTION_TYPES.find((t) => t.value === key);
  return found ? found.value : null;
}

/**
 * Design-system color tokens for a section type.
 * `pre` maps onto the `pre-chorus` palette entry so it doesn't fall back to muted.
 */
export function getLyricSectionColor(type: LyricSectionType | string) {
  return getSectionColor(type === "pre" ? "pre-chorus" : type);
}
