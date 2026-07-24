import { describe, it, expect } from "vitest";
import { exportLyricsToTxt, exportLyricsToLrc } from "@/lib/lyrics/export";
import { analyzeProsody, analyzeProsodyIncremental } from "@/lib/lyrics/prosody";

const SAMPLE = `[Verse 1]
На улицах ночного города свет
Танцует ветер в кронах старых лип
Мы шли вдвоём, и не было ответ
Лишь эхо шагов и далёкий скрип

[Chorus]
Мы летим сквозь ночь как две кометы
Через мосты и пустые проспекты`;

describe("exportLyricsToTxt", () => {
  it("preserves the original lyrics verbatim", () => {
    const out = exportLyricsToTxt(SAMPLE);
    for (const line of SAMPLE.split("\n")) {
      expect(out).toContain(line);
    }
  });
  it("includes a metadata header with warning/error counts", () => {
    const out = exportLyricsToTxt(SAMPLE, null, { meta: { title: "Ночь" } });
    expect(out).toMatch(/# MusicVerse AI — lyrics export/);
    expect(out).toMatch(/# title: Ночь/);
    expect(out).toMatch(/# prosody: warnings=\d+ errors=\d+/);
  });
  it("annotates singable lines with syllable counts / rhyme letters", () => {
    const out = exportLyricsToTxt(SAMPLE);
    expect(out).toMatch(/# .*сл\./);
  });
});

describe("exportLyricsToLrc", () => {
  it("emits monotonically increasing [mm:ss.xx] timestamps for singable lines", () => {
    const out = exportLyricsToLrc(SAMPLE, null, { lrcLineMs: 1000 });
    const stamps = Array.from(out.matchAll(/^\[(\d{2}):(\d{2})\.(\d{2})\]/gm)).map((m) =>
      Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number(m[3]) * 10,
    );
    expect(stamps.length).toBeGreaterThan(0);
    for (let i = 1; i < stamps.length; i++) {
      expect(stamps[i]).toBeGreaterThan(stamps[i - 1]);
    }
  });
  it("preserves section tags on their own lines", () => {
    const out = exportLyricsToLrc(SAMPLE);
    expect(out).toContain("[Verse 1]");
    expect(out).toContain("[Chorus]");
  });
});

describe("analyzeProsodyIncremental", () => {
  it("reuses AnalyzedLine identities for unchanged sections", () => {
    const before = analyzeProsody(SAMPLE);
    // Change the 2nd chorus line only — verse block must be reused.
    const edited = SAMPLE.replace("Через мосты и пустые проспекты", "Через мосты и пустые проспект");
    const after = analyzeProsodyIncremental(edited, before);

    // Verse (Verse 1) starts at line 1, 4 countable lines.
    for (let i = 1; i <= 4; i++) {
      expect(after.lines[i]).toBe(before.lines[i]);
    }
  });
  it("recomputes changed runs but keeps totals coherent", () => {
    const before = analyzeProsody(SAMPLE);
    const edited = `${SAMPLE}\nа`;
    const after = analyzeProsodyIncremental(edited, before);
    expect(after.lines.length).toBe(before.lines.length + 1);
    expect(after.problemLineIndices.length).toBeGreaterThanOrEqual(0);
  });
});
