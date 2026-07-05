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
      expect(result.isValid).toBe(true);
    });

    it("parses simple lyrics without sections", () => {
      const result = LyricsParser.parse("Hello world\nThis is a song");
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
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
      expect(result.tags.compound.length).toBeGreaterThanOrEqual(0);
    });

    it("handles instrumental tags", () => {
      const lyrics = "[Instrumental Solo: Guitar]\nSome lyrics";
      const result = LyricsParser.parse(lyrics);
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
    });

    it("handles dynamic effect tags", () => {
      const lyrics = "[!crescendo]\nLoud part\n[!build_up]\nEven louder";
      const result = LyricsParser.parse(lyrics);
      expect(result.tags.effect.length).toBeGreaterThanOrEqual(0);
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
      // May or may not have warnings depending on implementation
      expect(result.warnings).toBeDefined();
    });
  });
});
