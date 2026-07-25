/**
 * Lyrics editor helper functions — parse, serialize, compare, template
 * Extracted from LyricsVisualEditorCompact.tsx — Sprint 051 T056
 */

import { type LyricSectionType, LYRIC_SECTION_BY_VALUE, normalizeSectionType } from "./lyricsSectionMeta";

export type { LyricSectionType };

export interface LyricSection {
  id: string;
  type: LyricSectionType;
  content: string;
  tags?: string[];
}

/**
 * Section header: `[Verse]`, `[verse 2]`, `[Pre-Chorus]`, `[PreChorus 1]`…
 */
const SECTION_HEADER_RE = /^\[([a-zа-яё -]+?)(?:\s+\d+)?\]\s*$/i;

function makeSectionId(seed: number): string {
  return `sec-${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseLyrics(input: string): LyricSection[] {
  if (!input.trim()) return [];
  const lines = input.split(/\r?\n/);
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const match = line.match(SECTION_HEADER_RE);
    const type = match ? normalizeSectionType(match[1]) : null;
    if (type) {
      if (current) sections.push(current);
      current = {
        id: makeSectionId(sections.length),
        type,
        content: "",
      };
      continue;
    }
    if (!line) continue;
    if (current) {
      current.content = current.content ? `${current.content}\n${line}` : line;
    } else {
      current = {
        id: makeSectionId(sections.length),
        type: "verse",
        content: line,
      };
    }
  }
  if (current) sections.push(current);
  return sections;
}

/**
 * Serialize sections into Suno-style lyrics with auto-numbering.
 */
export function sectionsToLyrics(sections: LyricSection[]): string {
  const typeTotals = new Map<LyricSectionType, number>();
  for (const s of sections) typeTotals.set(s.type, (typeTotals.get(s.type) ?? 0) + 1);
  const seen = new Map<LyricSectionType, number>();

  return sections
    .map((s) => {
      const ordinal = (seen.get(s.type) ?? 0) + 1;
      seen.set(s.type, ordinal);
      const base = LYRIC_SECTION_BY_VALUE[s.type].header;
      const header = (typeTotals.get(s.type) ?? 0) > 1 ? `${base} ${ordinal}` : base;
      return `[${header}]\n${s.content}`.trim();
    })
    .filter((block) => block.length > "[x]".length)
    .join("\n\n");
}

export function sectionsEqual(a: LyricSection[], b: LyricSection[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type) return false;
    if (a[i].content !== b[i].content) return false;
  }
  return true;
}

/**
 * Replace section structure from a template, carrying verse-like content per type.
 */
export function applyTemplateToSections(
  prev: LyricSection[],
  template: LyricSectionType[],
  seedVerse = 1,
): LyricSection[] {
  const pools = new Map<LyricSectionType, string[]>();
  for (const s of prev) {
    if (!s.content) continue;
    const list = pools.get(s.type) ?? [];
    list.push(s.content);
    pools.set(s.type, list);
  }
  return template.map((type, i) => {
    const pool = pools.get(type);
    const content = pool && pool.length ? pool.shift()! : "";
    return {
      id: `sec-${seedVerse}-${i}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      content,
      tags: [],
    };
  });
}

/** Character budget shared with the text-mode editor (Suno v5/v5.5 hard limit is 5000). */
export const CHAR_LIMIT = 5000;
export const CHAR_DANGER = 4700;
export const CHAR_WARNING = 4300;

export interface QUICK_TEMPLATE_DEF {
  id: string;
  label: string;
  blurb: string;
  structure: LyricSectionType[];
}

export const QUICK_TEMPLATES: QUICK_TEMPLATE_DEF[] = [
  {
    id: "pop",
    label: "Pop",
    blurb: "Куплет → Припев, 6 блоков",
    structure: ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
  },
  {
    id: "rap",
    label: "Рэп",
    blurb: "Куплет → Хук, 4 блока",
    structure: ["verse", "hook", "verse", "hook"],
  },
  {
    id: "edm",
    label: "EDM",
    blurb: "Интро → Дроп, 6 блоков",
    structure: ["intro", "verse", "drop", "verse", "drop", "outro"],
  },
];
