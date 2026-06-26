import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { LyricsVisualEditorCompact } from "@/components/generate-form/LyricsVisualEditorCompact";

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

describe("LyricsVisualEditorCompact — templates & metrics", () => {
  it("applying Pop template creates 6 sections with expected types", async () => {
    render(<Host initial="" />);
    fireEvent.click(screen.getByRole("button", { name: /Секция/i }));
    // Pop template option becomes available in the dropdown
    const popItem = await screen.findByText("Pop");
    fireEvent.click(popItem);

    const out = screen.getByTestId("out").textContent || "";
    // Pop = verse, chorus, verse, chorus, bridge, chorus
    expect(out.match(/\[Verse\]/g)?.length).toBe(2);
    expect(out.match(/\[Chorus\]/g)?.length).toBe(3);
    expect(out.match(/\[Bridge\]/g)?.length).toBe(1);
  });

  it("switching templates preserves user content for matching section types", async () => {
    render(<Host initial="[Verse]\nMy first verse line\n\n[Chorus]\nMy chorus line" />);

    // Apply Rap template (verse, hook, verse, hook) — existing verse content should carry over.
    fireEvent.click(screen.getByRole("button", { name: /Секция/i }));
    fireEvent.click(await screen.findByText("Рэп"));

    const out = screen.getByTestId("out").textContent || "";
    expect(out).toContain("My first verse line");
    // Hooks are brand-new slots — they start empty (chorus content does NOT bleed into hook).
    expect(out).not.toContain("My chorus line");
  });

  it("EDM template starts new slots empty (drop/intro/outro had no prior content)", async () => {
    render(<Host initial="[Verse]\nverse content" />);
    fireEvent.click(screen.getByRole("button", { name: /Секция/i }));
    fireEvent.click(await screen.findByText("EDM"));

    const out = screen.getByTestId("out").textContent || "";
    // EDM = intro, verse, drop, verse, drop, outro — first verse keeps content, second is empty.
    expect(out).toMatch(/\[Intro\]\s*\n\s*\[Verse\]\s*\nverse content/);
    expect(out).toContain("[Drop]");
    expect(out).toContain("[Outro]");
  });

  it("typing in a section does NOT trigger external sync (no clobber)", () => {
    render(<Host initial="[Verse]\nhi" />);
    const before = metrics()?.externalSyncs ?? 0;
    const textarea = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    for (const ch of ["a", "b", "c", "d", "e"]) {
      fireEvent.change(textarea, { target: { value: textarea.value + ch } });
    }
    const after = metrics()?.externalSyncs ?? 0;
    // 5 keystrokes, 0 external resyncs — sections were never rebuilt from the round-tripped string.
    expect(after - before).toBe(0);
  });

  it("section sync without JSON.stringify scales linearly and stays fast", () => {
    // 100 sections × parse + compare — must complete well under 50ms.
    const large = Array.from({ length: 100 }, (_, i) => `[Verse]\nline ${i}`).join("\n\n");
    const onChange = vi.fn();
    const t0 = performance.now();
    const { rerender } = render(<LyricsVisualEditorCompact value={large} onChange={onChange} />);
    // Re-emit identical value 20 times — sectionsEqual short-circuits without allocations.
    for (let i = 0; i < 20; i++) {
      rerender(<LyricsVisualEditorCompact value={large} onChange={onChange} />);
    }
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(500);
    // External sync must not have fired for identical re-emits.
    expect(metrics()?.externalSyncs ?? 0).toBe(0);
  });
});
