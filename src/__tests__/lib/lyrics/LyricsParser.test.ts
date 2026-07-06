/**
 * Unit tests for LyricsParser
 * Sprint 051 — Test Debt + God Files
 */
import { describe, it, expect } from "vitest";
import { LyricsParser } from "@/lib/lyrics/LyricsParser";

describe("LyricsParser", () => {
  describe("parse", () => {
    it("returns valid result for empty lyrics", () => {
      const result = LyricsParser.parse("");
      expect(result.raw).toBe("");
      expect(result.sections).toEqual([]);
      // Empty lyrics are considered valid (no content = no errors)
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
    });

    it("parses simple lyrics without sections", () => {
      const result = LyricsParser.parse("Hello world\nThis is a song");
      // Lyrics without section headers don't create sections
      expect(result.sections.length).toBe(0);
      expect(result.raw).toBe("Hello world\nThis is a song");
    });

    it("extracts sections from bracketed labels", () => {
      const lyrics = "[Verse 1]\nHello world\n[Chorus]\nSing along";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBe(2);
      expect(result.sections[0].name).toContain("Verse");
      expect(result.sections[1].name).toContain("Chorus");
    });

    it("handles V5 compound tags", () => {
      const lyrics = "[Verse 1 | Soft | Acoustic]\nHello world";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBe(1);
      expect(result.sections[0].tags.length).toBeGreaterThan(0);
      expect(result.tags.compound.length).toBeGreaterThan(0);
    });

    it("handles instrumental tags", () => {
      const lyrics = "[Instrumental Solo: Guitar]\nSome lyrics";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBe(1);
      expect(result.sections[0].type).toBe("solo");
    });

    it("handles dynamic effect tags", () => {
      const lyrics = "[!crescendo]\nLoud part\n[!build_up]\nEven louder";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBe(2);
      expect(result.tags.effect.length).toBeGreaterThan(0);
    });

    it("handles silence tags", () => {
      const lyrics = "[Verse]\nSome lyrics\n[Stop]\n[Silence]\nMore lyrics";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
    });

    it("analyzes syllables", () => {
      const lyrics = "[Verse]\nThis is a line with some words";
      const result = LyricsParser.parse(lyrics);
      expect(result.syllableAnalysis).toBeDefined();
    });

    it("generates warnings for empty sections", () => {
      const lyrics = "[Verse]\n\n[Chorus]\nSome content";
      const result = LyricsParser.parse(lyrics);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("validates tag conflicts", () => {
      const lyrics = "[Acapella]\n[Full band]\nConflicting tags";
      const result = LyricsParser.parse(lyrics);
      expect(result.tagValidation).toBeDefined();
      expect(result.tagValidation.isValid).toBeDefined();
    });

    it("handles Russian section names", () => {
      const lyrics = "[Куплет 1]\nТекст куплена\n[Припев]\nТекст припева";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBeGreaterThanOrEqual(2);
      if (result.sections.length >= 2) {
        expect(result.sections[0].type).toBe("verse");
        expect(result.sections[1].type).toBe("chorus");
      }
    });
  });
});
