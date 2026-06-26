import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import {
  LyricsVisualEditorCompact,
  applyTemplateToSections,
  parseLyrics,
  sectionsEqual,
  sectionsToLyrics,
} from "@/components/generate-form/LyricsVisualEditorCompact";

const POP = ["verse", "chorus", "verse", "chorus", "bridge", "chorus"];
const RAP = ["verse", "hook", "verse", "hook"];
const EDM = ["intro", "verse", "drop", "verse", "drop", "outro"];

function Host({ initial }: { initial: string }) {
  const [lyrics, setLyrics] = useState(initial);
  return (
    <div>
      <output data-testid="out">{lyrics}</output>
      <LyricsVisualEditorCompact value={lyrics} onChange={setLyrics} />
    </div>
  );
}

function metrics() {
  return (window as unknown as { __lyricsEditorMetrics?: { renders: number; externalSyncs: number } })
    .__lyricsEditorMetrics;
}

describe("applyTemplateToSections", () => {
  it("Pop template produces 6 sections of expected types", () => {
    const out = applyTemplateToSections([], POP, 1);
    expect(out.map((s) => s.type)).toEqual(POP);
    expect(out.every((s) => s.content === "")).toBe(true);
  });

  it("Rap template preserves prior verse content in document order, hooks start empty", () => {
    const prev = parseLyrics("[Verse]\nMy first verse\n\n[Chorus]\nMy chorus");
    const out = applyTemplateToSections(prev, RAP, 1);
    expect(out.map((s) => s.type)).toEqual(RAP);
    expect(out[0].content).toBe("My first verse"); // verse → carried over
    expect(out[1].content).toBe(""); // hook → new slot, empty
    expect(out[2].content).toBe(""); // no second verse in source
    expect(out[3].content).toBe("");
  });

  it("EDM template carries verse into first verse slot, second verse + drops + outro stay empty", () => {
    const prev = parseLyrics("[Verse]\nverse content");
    const out = applyTemplateToSections(prev, EDM, 1);
    expect(out.map((s) => s.type)).toEqual(EDM);
    expect(out[0].content).toBe(""); // intro
    expect(out[1].content).toBe("verse content"); // verse → carried
    expect(out[2].content).toBe(""); // drop
    expect(out[3].content).toBe(""); // second verse — pool exhausted
    expect(out[5].content).toBe(""); // outro
  });

  it("multiple matching sources are popped in document order", () => {
    const prev = parseLyrics("[Verse]\nfirst\n\n[Verse]\nsecond\n\n[Verse]\nthird");
    const out = applyTemplateToSections(prev, ["verse", "chorus", "verse"], 1);
    expect(out[0].content).toBe("first");
    expect(out[2].content).toBe("second");
  });
});

describe("sectionsEqual", () => {
  it("ignores volatile IDs and compares only type+content", () => {
    const a = [
      { id: "x1", type: "verse" as const, content: "a" },
      { id: "x2", type: "chorus" as const, content: "b" },
    ];
    const b = [
      { id: "y1", type: "verse" as const, content: "a" },
      { id: "y2", type: "chorus" as const, content: "b" },
    ];
    expect(sectionsEqual(a, b)).toBe(true);
    expect(sectionsEqual(a, [{ ...b[0], content: "c" }, b[1]])).toBe(false);
    expect(sectionsEqual(a, [a[0]])).toBe(false);
  });

  it("is faster than JSON.stringify on large inputs", () => {
    const big = Array.from({ length: 500 }, (_, i) => ({
      id: `id-${i}`,
      type: "verse" as const,
      content: `line ${i} `.repeat(20),
    }));
    const copy = big.map((s) => ({ ...s, id: s.id + "x" }));

    const t1 = performance.now();
    for (let i = 0; i < 100; i++) sectionsEqual(big, copy);
    const fast = performance.now() - t1;

    const t2 = performance.now();
    for (let i = 0; i < 100; i++) {
      JSON.stringify(big.map((s) => ({ type: s.type, content: s.content })));
    }
    const slow = performance.now() - t2;

    // Structural compare should easily beat JSON.stringify on the same payload.
    expect(fast).toBeLessThan(slow);
  });
});

describe("LyricsVisualEditorCompact — render metrics", () => {
  it("typing does not trigger external sync (no parent → child clobber)", () => {
    render(<Host initial="[Verse]\nhi" />);
    const before = metrics()?.externalSyncs ?? 0;
    const textarea = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    for (const ch of "abcde") {
      fireEvent.change(textarea, { target: { value: textarea.value + ch } });
    }
    const after = metrics()?.externalSyncs ?? 0;
    expect(after - before).toBe(0);
  });

  it("identical re-emits of the value prop do not trigger external sync", () => {
    const onChange = vi.fn();
    const big = Array.from({ length: 50 }, (_, i) => `[Verse]\nline ${i}`).join("\n\n");
    const { rerender } = render(<LyricsVisualEditorCompact value={big} onChange={onChange} />);
    const baseline = metrics()?.externalSyncs ?? 0;
    for (let i = 0; i < 20; i++) {
      rerender(<LyricsVisualEditorCompact value={big} onChange={onChange} />);
    }
    expect((metrics()?.externalSyncs ?? 0) - baseline).toBe(0);
  });

  it("sectionsToLyrics round-trip is stable (parse → emit → parse equal)", () => {
    const src = "[Verse]\nhello\n\n[Chorus]\nworld";
    const parsed = parseLyrics(src);
    const round = parseLyrics(sectionsToLyrics(parsed));
    expect(sectionsEqual(parsed, round)).toBe(true);
  });
});
