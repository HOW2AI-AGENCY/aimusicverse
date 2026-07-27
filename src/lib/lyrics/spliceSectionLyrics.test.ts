import { describe, expect, it } from "vitest";
import { spliceSectionLyrics } from "./spliceSectionLyrics";

describe("spliceSectionLyrics", () => {
  it("replaces an exact section inside full lyrics", () => {
    const result = spliceSectionLyrics("[Verse]\nold line\n[Chorus]\nkeep", "old line", "new line");

    expect(result.spliced).toBe(true);
    expect(result.lyrics).toContain("new line");
    expect(result.lyrics).not.toContain("old line");
  });

  it("fuzzy matches when timestamped text misses a leading word", () => {
    const fullLyrics = "[Verse]\nЯ вхожу — и воздух рвётся, стены дрожат от грома\n[Chorus]\nkeep";
    const originalSection = "вхожу и воздух рвётся стены дрожат от грома";
    const editedSection = "влетаю — и воздух искрит, стены поют от грома";

    const result = spliceSectionLyrics(fullLyrics, originalSection, editedSection);

    expect(result.spliced).toBe(true);
    expect(result.lyrics).toContain(editedSection);
    expect(result.lyrics).toContain("[Chorus]");
  });
});