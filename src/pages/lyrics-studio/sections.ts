/**
 * Утилиты для парсинга текстов песен в/из секции.
 *
 * Раньше эти функции жили inline в `src/pages/LyricsStudio.tsx` (66+30 LOC).
 * Извлечены в Sprint 042 при декомпозиции god-page (1092 → ... LOC).
 */

import type { LyricsSection } from "@/components/lyrics-workspace";

const SECTION_PATTERNS: Array<{ pattern: RegExp; type: LyricsSection["type"] }> = [
  { pattern: /^\[(?:Verse|Куплет)/i, type: "verse" },
  { pattern: /^\[(?:Chorus|Припев)/i, type: "chorus" },
  { pattern: /^\[(?:Bridge|Бридж)/i, type: "bridge" },
  { pattern: /^\[(?:Intro|Интро)/i, type: "intro" },
  { pattern: /^\[(?:Outro|Аутро)/i, type: "outro" },
  { pattern: /^\[(?:Hook|Хук)/i, type: "hook" },
  { pattern: /^\[(?:Pre-?Chorus|Пре-?припев)/i, type: "prechorus" },
  { pattern: /^\[(?:Breakdown|Брейкдаун)/i, type: "breakdown" },
];

const TYPE_LABELS: Record<LyricsSection["type"], string> = {
  verse: "Verse",
  chorus: "Chorus",
  bridge: "Bridge",
  intro: "Intro",
  outro: "Outro",
  hook: "Hook",
  prechorus: "Pre-Chorus",
  breakdown: "Breakdown",
};

/**
 * Разбирает текст песни на секции (куплеты, припевы и т.д.).
 * Сохраняет порядок секций. Если маркеров секций нет — создаётся один куплет.
 */
export function parseLyricsToSections(lyrics: string): LyricsSection[] {
  if (!lyrics.trim()) return [];

  const sections: LyricsSection[] = [];
  const lines = lyrics.split("\n");
  let currentSection: LyricsSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    let foundSection = false;

    for (const { pattern, type } of SECTION_PATTERNS) {
      if (pattern.test(line)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          currentSection.content = currentContent.join("\n").trim();
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          id: `${type}-${Date.now()}-${sections.length}`,
          type,
          content: "",
          tags: [],
        };
        currentContent = [];
        foundSection = true;
        break;
      }
    }

    if (!foundSection && line.trim()) {
      currentContent.push(line);
    }
  }

  // Add last section
  if (currentSection && currentContent.length > 0) {
    currentSection.content = currentContent.join("\n").trim();
    sections.push(currentSection);
  }

  // If no sections found, create one verse
  if (sections.length === 0 && lyrics.trim()) {
    sections.push({
      id: `verse-${Date.now()}`,
      type: "verse",
      content: lyrics.trim(),
      tags: [],
    });
  }

  return sections;
}

/**
 * Обратная операция: собирает секции в текст в формате `[Label]\n...`.
 * Куплеты нумеруются (Verse 1, Verse 2), повторные припевы без номера.
 */
export function sectionsToLyrics(sections: LyricsSection[]): string {
  let verseCount = 0;
  let chorusCount = 0;

  return sections
    .map((section) => {
      let label = TYPE_LABELS[section.type] || "Section";
      if (section.type === "verse") {
        verseCount++;
        label = `Verse ${verseCount}`;
      } else if (section.type === "chorus") {
        chorusCount++;
        if (chorusCount > 1) label = "Chorus";
      }

      return `[${label}]\n${section.content}`;
    })
    .join("\n\n");
}
