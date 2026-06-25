/**
 * Lyrics Formatting Service
 * Utilities for formatting and displaying lyrics
 *
 * This module handles:
 * - Formatting lyrics for display (HTML, Markdown, structured sections)
 * - Extracting and analyzing lyrics structure
 * - Computing statistics for lyrics
 * - HTML escaping and sanitization
 *
 * @see src/services/lyrics/lyrics-types.ts for type definitions
 */

import { logger } from "@/lib/logger";
import type { FormattedLyrics, LyricsSection, LyricsStatistics } from "./lyrics-types";

// ============================================================================
// FORMATTING CONFIGURATION
// ============================================================================

const FORMATTING_CONFIG = {
  SECTION_PATTERNS: [
    { pattern: /\[verse\s*(\d*)\]/gi, type: "verse" as const, label: "Verse" },
    { pattern: /\[chorus\s*(\d*)\]/gi, type: "chorus" as const, label: "Chorus" },
    { pattern: /\[bridge\s*(\d*)\]/gi, type: "bridge" as const, label: "Bridge" },
    { pattern: /\[intro\]/gi, type: "intro" as const, label: "Intro" },
    { pattern: /\[outro\]/gi, type: "outro" as const, label: "Outro" },
    { pattern: /\[pre-chorus\s*(\d*)\]/gi, type: "pre-chorus" as const, label: "Pre-Chorus" },
    { pattern: /\[hook\s*(\d*)\]/gi, type: "chorus" as const, label: "Hook" },
  ],
  LINE_BREAK_THRESHOLD: 2, // Number of consecutive blank lines to detect sections
} as const;

// ============================================================================
// CORE FORMATTING OPERATIONS
// ============================================================================

/**
 * Formats lyrics content for display
 *
 * Parses raw lyrics text and generates multiple display formats:
 * - Structured sections (verse, chorus, etc.)
 * - HTML with proper formatting
 * - Markdown format
 *
 * @param content - Raw lyrics content
 * @returns FormattedLyrics with all display formats
 */
export function formatLyricsForDisplay(content: string): FormattedLyrics {
  logger.debug("Formatting lyrics for display", {
    contentLength: content.length,
  });

  // Extract sections
  const sections = extractLyricsSections(content);

  // Generate HTML
  const html = generateLyricsHTML(content, sections);

  // Generate Markdown
  const markdown = generateLyricsMarkdown(content, sections);

  const formatted: FormattedLyrics = {
    raw: content,
    sections,
    html,
    markdown,
  };

  logger.debug("Lyrics formatted successfully", {
    sectionsCount: sections.length,
    htmlLength: html.length,
    markdownLength: markdown.length,
  });

  return formatted;
}

/**
 * Extracts structured sections from lyrics content
 *
 * Identifies verse, chorus, bridge, and other structural elements
 * based on common notation patterns.
 *
 * @param content - Raw lyrics content
 * @returns Array of identified lyrics sections
 */
export function extractLyricsSections(content: string): LyricsSection[] {
  const sections: LyricsSection[] = [];
  const lines = content.split("\n");
  let currentIndex = 0;
  let currentSection: LyricsSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length;

    // Check if this line is a section marker
    let sectionMatch: { type: LyricsSection["type"]; label: string } | null = null;

    for (const { pattern, type, label } of FORMATTING_CONFIG.SECTION_PATTERNS) {
      const match = pattern.exec(line);
      if (match) {
        // Add number to label if present
        const number = match[1] ? ` ${match[1]}` : "";
        sectionMatch = { type, label: `${label}${number}` };
        pattern.lastIndex = 0; // Reset regex
        break;
      }
    }

    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.endIndex = currentIndex;
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        type: sectionMatch.type,
        label: sectionMatch.label,
        content: "",
        startIndex: currentIndex + lineLength + 1, // +1 for newline
        endIndex: 0,
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }

    currentIndex += lineLength + 1; // +1 for newline
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.endIndex = currentIndex;
    sections.push(currentSection);
  }

  // If no structured sections found, create a single "other" section
  if (sections.length === 0) {
    sections.push({
      type: "other",
      label: "Lyrics",
      content: content.trim(),
      startIndex: 0,
      endIndex: content.length,
    });
  }

  logger.debug("Lyrics sections extracted", {
    sectionsCount: sections.length,
    sectionTypes: sections.map((s) => s.type),
  });

  return sections;
}

/**
 * Computes comprehensive statistics for lyrics
 *
 * @param content - Raw lyrics content
 * @returns LyricsStatistics with word count, duration, structure info
 */
export function getLyricsStatistics(content: string): LyricsStatistics {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const characters = content.length;

  const wordCount = words.length;
  const lineCount = lines.length;
  const characterCount = characters;

  // Estimate duration (average: 2.5 seconds per line for medium tempo)
  const estimatedDuration = Math.round(lineCount * 2.5);

  // Check for structured sections
  const sections = extractLyricsSections(content);
  const hasStructuredSections = sections.length > 1 || (sections.length === 1 && sections[0].type !== "other");

  const sectionsCount = sections.length;

  const statistics: LyricsStatistics = {
    wordCount,
    lineCount,
    characterCount,
    estimatedDuration,
    hasStructuredSections,
    sectionsCount,
  };

  logger.debug("Lyrics statistics computed", { ...statistics });

  return statistics;
}

/**
 * Checks if content has structured sections
 *
 * @param content - Raw lyrics content
 * @returns true if structured sections are detected
 */
export function hasStructuredSections(content: string): boolean {
  const sections = extractLyricsSections(content);
  return sections.length > 1 || (sections.length === 1 && sections[0].type !== "other");
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generates HTML representation of lyrics
 *
 * @param content - Raw lyrics content
 * @param sections - Extracted sections (optional, will be extracted if not provided)
 * @returns HTML string with proper formatting
 */
function generateLyricsHTML(content: string, sections?: LyricsSection[]): string {
  const extractedSections = sections || extractLyricsSections(content);

  if (extractedSections.length === 0) {
    return escapeHtml(content).replace(/\n/g, "<br>");
  }

  let html = "";

  for (const section of extractedSections) {
    // Add section label if it's not "other"
    if (section.type !== "other") {
      html += `<h3 class="lyrics-section-label lyrics-section-${section.type}">${escapeHtml(section.label)}</h3>`;
    }

    // Add section content
    const escapedContent = escapeHtml(section.content);
    const contentLines = escapedContent.split("\n");

    html += '<div class="lyrics-section-content">';

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];
      if (line.trim().length > 0) {
        html += `<p class="lyrics-line" data-line-index="${i}">${line}</p>`;
      }
    }

    html += "</div>";
  }

  return html;
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

/**
 * Generates Markdown representation of lyrics
 *
 * @param content - Raw lyrics content
 * @param sections - Extracted sections (optional, will be extracted if not provided)
 * @returns Markdown string with proper formatting
 */
function generateLyricsMarkdown(content: string, sections?: LyricsSection[]): string {
  const extractedSections = sections || extractLyricsSections(content);

  if (extractedSections.length === 0) {
    return content;
  }

  let markdown = "";

  for (const section of extractedSections) {
    // Add section label if it's not "other"
    if (section.type !== "other") {
      markdown += `### ${section.label}\n\n`;
    }

    // Add section content
    markdown += section.content.trim() + "\n\n";
  }

  return markdown;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters
 *
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#47;",
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

/**
 * Formats lyrics for karaoke-style display
 *
 * @param content - Raw lyrics content
 * @returns Array of time-synced lyric lines (placeholder for future sync)
 */
export function formatLyricsForKaraoke(content: string): Array<{
  text: string;
  startTime?: number;
  endTime?: number;
}> {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  return lines.map((line, index) => ({
    text: line.trim(),
    // Time sync would be added here when we implement time-synced lyrics
    startTime: index * 3, // Placeholder: 3 seconds per line
    endTime: (index + 1) * 3,
  }));
}

/**
 * Formats lyrics for export as plain text
 *
 * @param content - Raw lyrics content
 * @param options - Formatting options
 * @returns Plain text formatted for export
 */
export function formatLyricsForExport(
  content: string,
  options?: {
    includeSectionLabels?: boolean;
    lineNumbers?: boolean;
    timestamp?: boolean;
  },
): string {
  const sections = extractLyricsSections(content);
  let exported = "";

  for (const section of sections) {
    // Add section label if requested
    if (options?.includeSectionLabels && section.type !== "other") {
      exported += `[${section.label}]\n`;
    }

    // Add section content with optional line numbers
    const lines = section.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (options?.lineNumbers) {
        exported += `${i + 1}. `;
      }

      if (options?.timestamp) {
        const timestamp = new Date().toISOString();
        exported += `[${timestamp}] `;
      }

      exported += line + "\n";
    }

    exported += "\n"; // Blank line between sections
  }

  return exported.trim();
}

/**
 * Compresses lyrics by removing extra whitespace
 *
 * @param content - Raw lyrics content
 * @returns Compressed lyrics content
 */
export function compressLyrics(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Expands compressed lyrics with proper spacing
 *
 * @param content - Compressed lyrics content
 * @returns Expanded lyrics with standard formatting
 */
export function expandLyrics(content: string): string {
  const lines = content.split("\n");
  let expanded = "";
  let blankLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Add blank line between sections (detected by common patterns)
    if (isSectionMarker(line)) {
      if (i > 0) expanded += "\n";
      blankLines = 0;
    }

    expanded += line + "\n";

    // Add blank line after consecutive non-marker lines
    if (!isSectionMarker(line)) {
      blankLines++;
      if (blankLines >= 4) {
        // Every 4 lines, add extra spacing
        expanded += "\n";
        blankLines = 0;
      }
    }
  }

  return expanded.trim();
}

/**
 * Checks if a line is a section marker
 */
function isSectionMarker(line: string): boolean {
  return FORMATTING_CONFIG.SECTION_PATTERNS.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(line);
  });
}

/**
 * Generates a summary of lyrics structure
 *
 * @param content - Raw lyrics content
 * @returns Object with structure summary
 */
export function generateLyricsStructureSummary(content: string): {
  totalSections: number;
  sectionTypes: Record<string, number>;
  averageLinesPerSection: number;
  hasIntro: boolean;
  hasOutro: boolean;
  hasBridge: boolean;
} {
  const sections = extractLyricsSections(content);

  const sectionTypes: Record<string, number> = {};
  let totalLines = 0;

  for (const section of sections) {
    sectionTypes[section.type] = (sectionTypes[section.type] || 0) + 1;
    totalLines += section.content.split("\n").filter((line) => line.trim().length > 0).length;
  }

  return {
    totalSections: sections.length,
    sectionTypes,
    averageLinesPerSection: sections.length > 0 ? Math.round(totalLines / sections.length) : 0,
    hasIntro: sections.some((s) => s.type === "intro"),
    hasOutro: sections.some((s) => s.type === "outro"),
    hasBridge: sections.some((s) => s.type === "bridge"),
  };
}
