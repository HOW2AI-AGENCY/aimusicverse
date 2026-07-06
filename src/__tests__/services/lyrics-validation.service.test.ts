/**
 * Unit tests for lyrics-validation.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  validateLyricsContent,
  validateSectionNoteContent,
  validateSaveLyricsRequest,
  analyzeContentQuality,
  getLyricsStatistics,
  hasStructuredSections,
} from "@/services/lyrics/lyrics-validation.service";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("lyrics-validation.service", () => {
  describe("validateLyricsContent", () => {
    it("rejects empty content", () => {
      const result = validateLyricsContent("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Lyrics content cannot be empty");
    });

    it("rejects whitespace-only content", () => {
      const result = validateLyricsContent("   ");
      expect(result.isValid).toBe(false);
    });

    it("accepts valid lyrics", () => {
      const result = validateLyricsContent("[Verse]\nHello world\nThis is a song");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("warns about very short lyrics", () => {
      const result = validateLyricsContent("Hi");
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("rejects content exceeding max length", () => {
      const longContent = "a".repeat(10001);
      const result = validateLyricsContent(longContent);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateSectionNoteContent", () => {
    it("rejects empty content", () => {
      const result = validateSectionNoteContent("");
      expect(result.isValid).toBe(false);
    });

    it("accepts valid note", () => {
      const result = validateSectionNoteContent("Add harmony here");
      expect(result.isValid).toBe(true);
    });

    it("rejects content exceeding max length", () => {
      const longContent = "a".repeat(5001);
      const result = validateSectionNoteContent(longContent);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateSaveLyricsRequest", () => {
    it("rejects request without content", () => {
      const result = validateSaveLyricsRequest({
        content: "",
        changeType: "manual_edit",
        trackId: "t1",
        authorId: "u1",
      });
      expect(result.isValid).toBe(false);
    });

    it("rejects request without trackId", () => {
      const result = validateSaveLyricsRequest({
        content: "Hello",
        changeType: "manual_edit",
        trackId: "",
        authorId: "u1",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts valid request", () => {
      const result = validateSaveLyricsRequest({
        content: "[Verse]\nHello world\nThis is a test song with enough words",
        changeType: "manual_edit",
        trackId: "t1",
        authorId: "u1",
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("analyzeContentQuality", () => {
    it("returns quality metrics", () => {
      const metrics = analyzeContentQuality("[Verse]\nHello world\nHow are you\n[Chorus]\nFine thanks");

      expect(metrics.wordCount).toBeGreaterThan(0);
      expect(metrics.lineCount).toBeGreaterThan(0);
      expect(metrics.characterCount).toBeGreaterThan(0);
      expect(typeof metrics.hasStructure).toBe("boolean");
      expect(metrics.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.readabilityScore).toBeLessThanOrEqual(100);
    });

    it("handles empty content", () => {
      const metrics = analyzeContentQuality("");
      expect(metrics.wordCount).toBe(0);
    });
  });

  describe("getLyricsStatistics", () => {
    it("counts words and lines", () => {
      const stats = getLyricsStatistics("[Verse]\nHello world\nHow are you");
      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.lineCount).toBeGreaterThan(0);
    });

    it("handles empty input", () => {
      const stats = getLyricsStatistics("");
      expect(stats.wordCount).toBe(0);
    });
  });

  describe("hasStructuredSections", () => {
    it("returns true for structured lyrics", () => {
      expect(hasStructuredSections("[Verse]\nHello\n[Chorus]\nWorld")).toBe(true);
    });

    it("returns false for plain text", () => {
      expect(hasStructuredSections("Just plain text")).toBe(false);
    });
  });
});
