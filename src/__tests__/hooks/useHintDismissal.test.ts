import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHintDismissal } from "@/hooks/useHintDismissal";

const STORAGE_KEY = "musicverse_hints_dismissed";

describe("useHintDismissal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns false for undismissed hint", () => {
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    expect(result.current[0]).toBe(false);
  });

  it("returns dismiss function", () => {
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    expect(typeof result.current[1]).toBe("function");
  });

  it("persists dismissed state to localStorage", () => {
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    act(() => result.current[1]());
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.moreMenuHint).toBe(true);
  });

  it("returns true after dismiss", () => {
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });

  it("loads previously dismissed state", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ moreMenuHint: true, gestureHint: false }));
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    expect(result.current[0]).toBe(true);
  });

  it("treats different keys independently", () => {
    const { result: a } = renderHook(() => useHintDismissal("moreMenuHint"));
    const { result: b } = renderHook(() => useHintDismissal("gestureHint"));
    act(() => a.current[1]());
    expect(a.current[0]).toBe(true);
    expect(b.current[0]).toBe(false);
  });

  it("handles corrupt localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    expect(result.current[0]).toBe(false);
  });

  it("handles localStorage quota error gracefully", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() => useHintDismissal("moreMenuHint"));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    setItem.mockRestore();
  });
});
