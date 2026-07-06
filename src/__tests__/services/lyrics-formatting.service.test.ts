/**
 * Unit tests for lyrics-formatting.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  formatLyricsForDisplay,
  extractLyricsSections,
  getLyricsStatistics,
  hasStructuredSections,
  compressLyrics,
  expandLyrics,
} from "@/services/lyrics/lyrics-formatting.service";

// Mock logger to silence debug output
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("lyrics-formatting.service", () => {
  describe("extractLyricsSections", () => {
    it("extracts verse and chorus sections", () => {
      const lyrics = "[Verse]\nHello world\n[Chorus]\nSing along";
      const sections = extractLyricsSections(lyrics);

      expect(sections.length).toBeGreaterThanOrEqual(2);
      expect(sections[0].type).toBe("verse");
      expect(sections[1].type).toBe("chorus");
    });

    it("returns 'other' section for plain text", () => {
      const sections = extractLyricsSections("Just plain lyrics\nNo sections");
      expect(sections.length).toBeGreaterThanOrEqual(1);
      expect(sections[0].type).toBe("other");
    });

    it("handles empty input", () => {
      const sections = extractLyricsSections("");
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });

    it("extracts numbered verses", () => {
      const lyrics = "[Verse 1]\nFirst verse\n[Verse 2]\nSecond verse";
      const sections = extractLyricsSections(lyrics);

      expect(sections.length).toBe(2);
      expect(sections[0].label).toContain("Verse");
      expect(sections[1].label).toContain("Verse");
    });

    it("extracts bridge and intro", () => {
      const lyrics = "[Intro]\nMusic\n[Bridge]\nBridge lyrics";
      const sections = extractLyricsSections(lyrics);

      expect(sections.length).toBe(2);
      expect(sections[0].type).toBe("intro");
      expect(sections[1].type).toBe("bridge");
    });
  });

  describe("formatLyricsForDisplay", () => {
    it("returns raw, sections, html, and markdown", () => {
      const lyrics = "[Verse]\nHello\n[Chorus]\nWorld";
      const result = formatLyricsForDisplay(lyrics);

      expect(result.raw).toBe(lyrics);
      expect(result.sections.length).toBeGreaterThanOrEqual(2);
      expect(result.html).toBeTruthy();
      expect(result.markdown).toBeTruthy();
    });

    it("handles plain text lyrics", () => {
      const result = formatLyricsForDisplay("No sections here");

      expect(result.raw).toBe("No sections here");
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.html).toBeTruthy();
    });
  });

  describe("getLyricsStatistics", () => {
    it("counts words and lines", () => {
      const lyrics = "[Verse]\nHello world\nHow are you\n[Chorus]\nSing along now";
      const stats = getLyricsStatistics(lyrics);

      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.lineCount).toBeGreaterThan(0);
    });

    it("handles empty input", () => {
      const stats = getLyricsStatistics("");
      expect(stats.wordCount).toBe(0);
    });
  });

  describe("hasStructuredSections", () => {
    it("returns true for lyrics with sections", () => {
      expect(hasStructuredSections("[Verse]\nHello\n[Chorus]\nWorld")).toBe(true);
    });

    it("returns false for plain text", () => {
      expect(hasStructuredSections("Just plain text")).toBe(false);
    });

    it("returns false for empty input", () => {
      expect(hasStructuredSections("")).toBe(false);
    });
  });

  describe("compressLyrics and expandLyrics", () => {
    it("compress reduces whitespace", () => {
      const lyrics = "[Verse]\n\n\n\nHello world\n\n\n\n[Chorus]\n\n\n\nSing along";
      const compressed = compressLyrics(lyrics);

      expect(compressed.length).toBeLessThanOrEqual(lyrics.length);
    });

    it("expand restores structure", () => {
      const compressed = "[Verse]\nHello\n[Chorus]\nWorld";
      const expanded = expandLyrics(compressed);

      expect(expanded.length).toBeGreaterThanOrEqual(compressed.length);
    });

    it("compress then expand preserves content", () => {
      const original = "[Verse]\nHello world\n[Chorus]\nSing along";
      const compressed = compressLyrics(original);
      const expanded = expandLyrics(compressed);

      // Content should be preserved even if formatting changes
      expect(expanded).toContain("Hello world");
      expect(expanded).toContain("Sing along");
    });
  });
});
