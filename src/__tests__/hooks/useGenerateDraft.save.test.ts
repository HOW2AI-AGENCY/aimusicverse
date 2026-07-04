/**
 * Sprint 055-A3: Unit tests for useGenerateDraft.saveDraft round-trip.
 *
 * Guarantees:
 *  - saveDraft({ description, title }) writes JSON to localStorage
 *  - saved payload matches GenerateDraft shape (mode + 4 text fields + meta)
 *  - clearDraft removes the key
 *  - Empty payload is NOT persisted (no spurious drafts)
 *  - saveDraft does not throw on quota error
 *  - Round-trip: saveDraft → load via remount → fields match
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateDraft } from "@/hooks/generation/useGenerateDraft";

const DRAFT_KEY = "generate_form_draft";

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  localStorage.clear();
});

describe("useGenerateDraft.saveDraft (Sprint 055 P0-3)", () => {
  it("persists description+title to localStorage with the expected shape", () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({
        mode: "simple",
        description: "Энергичный поп с гитарой",
        title: "Test Song",
        hasVocals: true,
      });
    });

    const stored = localStorage.getItem(DRAFT_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe("simple");
    expect(parsed.description).toBe("Энергичный поп с гитарой");
    expect(parsed.title).toBe("Test Song");
    expect(parsed.hasVocals).toBe(true);
    expect(typeof parsed.savedAt).toBe("number");
    expect(parsed.savedAt).toBeGreaterThan(0);
    expect(parsed.version).toBe(1);
  });

  it("does NOT persist when all content fields are empty", () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({
        mode: "custom",
        description: "",
        title: "",
        lyrics: "",
        style: "",
      });
    });

    const stored = localStorage.getItem(DRAFT_KEY);
    expect(stored).toBeNull();
  });

  it("clearDraft removes the localStorage key", () => {
    const { result } = renderHook(() => useGenerateDraft());

    act(() => {
      result.current.saveDraft({ description: "do not lose" });
    });
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();

    act(() => {
      result.current.clearDraft();
    });
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("round-trips: save → remount → fields are available again", () => {
    const first = renderHook(() => useGenerateDraft());
    act(() => {
      first.result.current.saveDraft({
        mode: "custom",
        description: "Ambient pad",
        title: "Roundtrip",
        style: "lo-fi, atmospheric",
        lyrics: "",
        hasVocals: false,
      });
    });
    first.unmount();

    const second = renderHook(() => useGenerateDraft());
    expect(second.result.current.hasDraft).toBe(true);
    expect(second.result.current.draft?.description).toBe("Ambient pad");
    expect(second.result.current.draft?.title).toBe("Roundtrip");
    expect(second.result.current.draft?.style).toBe("lo-fi, atmospheric");
    expect(second.result.current.draft?.hasVocals).toBe(false);
  });

  it("does not throw when localStorage.setItem fails (quota)", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useGenerateDraft());

    expect(() => {
      act(() => {
        result.current.saveDraft({ description: "this should not throw" });
      });
    }).not.toThrow();

    setItemSpy.mockRestore();
  });
});
