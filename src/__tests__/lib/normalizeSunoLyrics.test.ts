import { describe, it, expect } from "vitest";
import { normalizeSunoLyrics, normalizeSunoLyricsDetailed } from "@/lib/lyrics/normalizeSunoLyrics";

describe("normalizeSunoLyrics", () => {
  it("strips markdown bold around section tags", () => {
    expect(normalizeSunoLyrics("**[Verse]**\nline one")).toBe("[Verse]\nline one");
    expect(normalizeSunoLyrics("__[Chorus]__")).toBe("[Chorus]");
  });

  it("wraps bare section words in brackets", () => {
    expect(normalizeSunoLyrics("**Verse 1**\ntext")).toBe("[Verse 1]\ntext");
    expect(normalizeSunoLyrics("Chorus:")).toBe("[Chorus]");
    expect(normalizeSunoLyrics("Припев")).toBe("[Припев]");
  });

  it("removes markdown headings", () => {
    expect(normalizeSunoLyrics("## Bridge\nwords")).toBe("[Bridge]\nwords");
  });

  it("keeps ordinary lyric lines untouched", () => {
    expect(normalizeSunoLyrics("[Verse]\nI walk alone tonight")).toBe("[Verse]\nI walk alone tonight");
  });

  it("collapses excessive blank lines and trims", () => {
    expect(normalizeSunoLyrics("\n\n[Intro]\n\n\n\nla la\n\n")).toBe("[Intro]\n\nla la");
  });

  it("reports whether normalization changed anything", () => {
    expect(normalizeSunoLyricsDetailed("**[Verse]**").changed).toBe(true);
    expect(normalizeSunoLyricsDetailed("[Verse]\nline").changed).toBe(false);
    expect(normalizeSunoLyricsDetailed("").lyrics).toBe("");
  });
});
