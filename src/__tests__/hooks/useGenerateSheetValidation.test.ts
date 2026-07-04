/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 2).
 *
 * Unit tests for `useGenerateSheetValidation`. Verbatim from the brief's
 * Step 1: 6 cases covering empty style, empty title, insufficient credits,
 * oversized lyrics, fully-valid form, and warnings-only form.
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { useGenerateSheetValidation, type ValidationFormSlice } from "@/hooks/generation/useGenerateSheetValidation";

const emptyForm = {
  title: "",
  style: "",
  lyrics: "",
  mode: "custom",
  model: "v5",
  hasVocals: true,
  vocalGender: "",
  audioFile: null,
  selectedArtistId: undefined,
  selectedProjectId: undefined,
  customVoiceId: null,
} as never;

describe("useGenerateSheetValidation", () => {
  it("flags empty style as error", () => {
    const { result } = renderHook(() => useGenerateSheetValidation(emptyForm, 100, 8));
    const styleReason = result.current.reasons.find((r) => r.field === "style");
    expect(styleReason?.severity).toBe("error");
    expect(result.current.canGenerate).toBe(false);
  });

  it("flags empty title as warning only", () => {
    const { result } = renderHook(() => useGenerateSheetValidation(emptyForm, 100, 8));
    const titleReason = result.current.reasons.find((r) => r.field === "title");
    expect(titleReason?.severity).toBe("warning");
  });

  it("flags insufficient credits as error", () => {
    const { result } = renderHook(() => useGenerateSheetValidation({ ...emptyForm, style: "rock" }, 5, 8));
    const creditsReason = result.current.reasons.find((r) => r.field === "credits");
    expect(creditsReason?.severity).toBe("error");
  });

  it("flags lyrics >3000 chars as error", () => {
    const long = "a".repeat(3001);
    const { result } = renderHook(() =>
      useGenerateSheetValidation({ ...emptyForm, style: "rock", lyrics: long }, 100, 8),
    );
    const lyricsReason = result.current.reasons.find((r) => r.field === "lyrics");
    expect(lyricsReason?.severity).toBe("error");
  });

  it("returns canGenerate=true when form is valid and credits sufficient", () => {
    const valid = { ...emptyForm, style: "rock", lyrics: "Hello", title: "My Song" };
    const { result } = renderHook(() => useGenerateSheetValidation(valid, 100, 8));
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.hasWarnings).toBe(false);
    expect(result.current.reasons).toHaveLength(0);
  });

  it("hasWarnings=true when only warnings present (no errors)", () => {
    const noTitle = { ...emptyForm, style: "rock", lyrics: "Hello" };
    const { result } = renderHook(() => useGenerateSheetValidation(noTitle, 100, 8));
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.hasWarnings).toBe(true);
  });

  it("accepts a realistic UseGenerateFormReturn-shape object without 'as never'", () => {
    const realisticForm = {
      mode: "custom" as const,
      style: "rock",
      description: "",
      lyrics: "Hello",
      title: "Song",
      hasVocals: true,
      vocalGender: "",
      audioFile: null,
    } satisfies ValidationFormSlice;
    const { result } = renderHook(() => useGenerateSheetValidation(realisticForm, 100, 8));
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.reasons).toHaveLength(0);
  });
});
