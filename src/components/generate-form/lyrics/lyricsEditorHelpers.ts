/**
 * Helper functions for LyricsVisualEditorCompact
 * Sprint 051 — Test Debt + God Files Decomposition
 */

import type { LyricSection, LyricSectionType } from "./LyricsVisualEditorCompact";

/**
 * Parse lyrics input into structured sections
 */
export function parseLyrics(input: string): LyricSection[] {
  if (!input.trim()) {
    return [];
  }

  const lines = input.split("\n").filter((line) => line.trim());
  const sections: LyricSection[] = [];
  let currentSection: LyricSection | null = null;
  let sectionCounter = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers (e.g., [verse], [chorus], [intro])
    const sectionMatch = trimmed.match(/^\[([a-zA-Z0-9]+)\]$/);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        id: `section-${sectionCounter++}`,
        type: sectionMatch[1].toLowerCase() as LyricSectionType,
        content: "",
        tags: [],
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += (currentSection.content ? "\n" : "") + trimmed;
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Convert sections array back to lyrics string
 */
export function sectionsToLyrics(sections: LyricSection[]): string {
  return sections
    .map((section) => {
      const header = `[${section.type.toUpperCase()}]`;
      const content = section.content.trim();
      return content ? `${header}\n${content}` : header;
    })
    .join("\n\n");
}

/**
 * Check if two sections arrays are equal
 */
export function sectionsEqual(a: LyricSection[], b: LyricSection[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((section, index) => {
    const other = b[index];
    return (
      section.id === other.id &&
      section.type === other.type &&
      section.content === other.content &&
      JSON.stringify(section.tags) === JSON.stringify(other.tags)
    );
  });
}

/**
 * Apply template structure to sections
 */
export function applyTemplateToSections(
  sections: LyricSection[],
  templateStructure: LyricSectionType[],
): LyricSection[] {
  const result: LyricSection[] = [];
  let sectionIndex = 0;

  for (const sectionType of templateStructure) {
    if (sectionIndex < sections.length) {
      const existingSection = sections[sectionIndex];
      result.push({
        ...existingSection,
        type: sectionType,
      });
      sectionIndex++;
    } else {
      // Create new empty section
      result.push({
        id: `section-${Date.now()}-${result.length}`,
        type: sectionType,
        content: "",
        tags: [],
      });
    }
  }

  // Append any remaining sections
  while (sectionIndex < sections.length) {
    result.push(sections[sectionIndex]);
    sectionIndex++;
  }

  return result;
}
