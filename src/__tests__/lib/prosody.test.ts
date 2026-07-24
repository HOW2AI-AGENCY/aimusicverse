import { describe, it, expect } from "vitest";
import { analyzeProsody, countSyllables, getRhymeKey } from "@/lib/lyrics/prosody";
import { extractPartialLyrics } from "@/lib/lyrics/streaming";

describe("prosody.countSyllables", () => {
  it("counts Russian vowels one-by-one", () => {
    expect(countSyllables("Когда ты рядом мир замирает")).toBe(10);
  });
  it("merges English vowel clusters", () => {
    expect(countSyllables("beautiful morning sunrise")).toBe(7);
  });
  it("ignores tags and parenthesised back-vocals", () => {
    expect(countSyllables("[Chorus] (ooh, aah)")).toBe(0);
  });
});

describe("prosody.getRhymeKey", () => {
  it("returns last-vowel suffix", () => {
    const a = getRhymeKey("мир замирает");
    const b = getRhymeKey("время тает");
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    // Both end in -ает — should share last-2 suffix
    expect(a!.slice(-2)).toBe(b!.slice(-2));
  });
});

describe("prosody.analyzeProsody", () => {
  it("flags too-short and way-too-long lines", () => {
    const text = "[Verse]\nда\nэто очень очень очень длинная строка которая идёт бесконечно и точно превышает лимит";
    const report = analyzeProsody(text);
    const short = report.lines.find((l) => l.raw === "да");
    const long = report.lines.find((l) => l.raw.startsWith("это очень"));
    expect(short?.issues.some((i) => i.code === "too-short")).toBe(true);
    expect(long?.issues.some((i) => i.code === "way-too-long")).toBe(true);
  });

  it("assigns rhyme groups within a section", () => {
    const text = [
      "[Verse]",
      "Когда ты рядом мир замирает",
      "И время тает как снег весной",
      "Ты в моих мыслях каждый раз",
      "Как первый утренний рассвет свой",
    ].join("\n");
    const report = analyzeProsody(text);
    const withGroups = report.lines.filter((l) => l.rhymeGroup);
    // At least two lines should form a rhyme group (ABAB or AABB)
    expect(withGroups.length).toBeGreaterThanOrEqual(2);
    expect(report.sections[0]?.scheme.length).toBe(4);
  });
});

describe("streaming.extractPartialLyrics", () => {
  it("returns null before the lyrics field appears", () => {
    expect(extractPartialLyrics('{"title":"x"')).toBeNull();
  });
  it("returns partial content while streaming", () => {
    expect(extractPartialLyrics('{"lyrics":"hello wor')).toBe("hello wor");
  });
  it("unescapes \\n newlines in partial output", () => {
    expect(extractPartialLyrics('{"lyrics":"line1\\nline2')).toBe("line1\nline2");
  });
  it("returns the full string once closed", () => {
    expect(extractPartialLyrics('{"lyrics":"done","title":"x"}')).toBe("done");
  });
});
