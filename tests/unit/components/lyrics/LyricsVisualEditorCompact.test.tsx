import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { LyricsVisualEditorCompact } from "@/components/generate-form/LyricsVisualEditorCompact";

/**
 * Host component that mimics the parent (LyricsSectionAdvanced) wiring:
 * a single `lyrics` string is the source of truth, the visual editor reads it
 * and reports changes back.  We can swap to a `text` mode by unmounting the
 * editor — which is exactly how mode switching works in production.
 */
function Host({ initial, mode = "visual" }: { initial: string; mode?: "visual" | "text" }) {
  const [lyrics, setLyrics] = useState(initial);
  const [m, setM] = useState(mode);
  return (
    <div>
      <button type="button" onClick={() => setM("text")} data-testid="to-text">
        text
      </button>
      <button type="button" onClick={() => setM("visual")} data-testid="to-visual">
        visual
      </button>
      <output data-testid="lyrics-out">{lyrics}</output>
      {m === "visual" ? (
        <LyricsVisualEditorCompact value={lyrics} onChange={setLyrics} />
      ) : (
        <textarea data-testid="plain" value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
      )}
    </div>
  );
}

describe("LyricsVisualEditorCompact", () => {
  it("does not lose textarea focus on keystroke (no clobber from parent re-render)", () => {
    render(<Host initial={"[Verse]\nhello"} />);
    const textarea = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    fireEvent.change(textarea, { target: { value: "hello world" } });

    // Same DOM node is still focused — proves the section wasn't re-keyed.
    const after = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    expect(after).toBe(textarea);
    expect(document.activeElement).toBe(textarea);
    expect(screen.getByTestId("lyrics-out").textContent).toContain("hello world");
  });

  it("preserves edits when switching visual → text → visual", () => {
    const { rerender } = render(<Host initial={"[Verse]\nfirst"} />);
    const textarea = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "edited verse" } });

    expect(screen.getByTestId("lyrics-out").textContent).toContain("edited verse");

    // Switch to text mode
    act(() => {
      fireEvent.click(screen.getByTestId("to-text"));
    });
    expect((screen.getByTestId("plain") as HTMLTextAreaElement).value).toContain("edited verse");

    // Back to visual
    act(() => {
      fireEvent.click(screen.getByTestId("to-visual"));
    });
    const back = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    expect(back.value).toBe("edited verse");

    rerender(<Host initial={"[Verse]\nfirst"} />);
  });

  it("syncs external value changes without clobbering local IDs unnecessarily", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <LyricsVisualEditorCompact value={"[Verse]\nhello"} onChange={onChange} />,
    );
    const before = screen.getAllByRole("textbox")[0];

    // External value re-emit identical to what we just produced should NOT remount.
    rerender(<LyricsVisualEditorCompact value={"[Verse]\nhello"} onChange={onChange} />);
    const after = screen.getAllByRole("textbox")[0];
    expect(after).toBe(before);

    // Truly external change (different content) should resync.
    rerender(<LyricsVisualEditorCompact value={"[Verse]\nbrand new"} onChange={onChange} />);
    const updated = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    expect(updated.value).toBe("brand new");
  });
});
