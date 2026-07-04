import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLyricsSections } from "@/components/generate-form/lyrics/useLyricsSections";

describe("useLyricsSections", () => {
  it("parses plain text into sections on init", () => {
    const text = "[Verse]\nLine 1\nLine 2\n[Chorus]\nChorus line";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    expect(result.current.sections).toHaveLength(2);
    expect(result.current.sections[0].type).toBe("verse");
    expect(result.current.sections[0].content).toBe("Line 1\nLine 2");
    expect(result.current.sections[1].type).toBe("chorus");
  });

  it("serializes back to plain text on toPlainText", () => {
    const text = "[Verse]\nHello\n[Chorus]\nWorld";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    const out = result.current.toPlainText();
    expect(out).toBe(text);
  });

  it("addSection appends a new section", () => {
    const { result } = renderHook(() => useLyricsSections("", vi.fn()));
    act(() => result.current.addSection("verse"));
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].type).toBe("verse");
  });

  it("removeSection removes by id", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]\nA\n[Chorus]\nB", vi.fn()));
    const id = result.current.sections[0].id;
    act(() => result.current.removeSection(id));
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].type).toBe("chorus");
  });

  it("reorderSections moves sections", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]\nA\n[Chorus]\nB", vi.fn()));
    act(() => result.current.reorderSections(0, 1));
    expect(result.current.sections[0].type).toBe("chorus");
    expect(result.current.sections[1].type).toBe("verse");
  });

  it("applyTemplate replaces all sections", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]\nA", vi.fn()));
    act(() => result.current.applyTemplate("pop-standard"));
    expect(result.current.sections).toHaveLength(6);
  });

  it("stats computes totalChars and totalLines", () => {
    const text = "[Verse]\nLine 1\nLine 2\n[Chorus]\nHi";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    expect(result.current.stats.totalChars).toBe(15);
    expect(result.current.stats.totalLines).toBe(3);
  });
});