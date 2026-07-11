import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

describe("useFeatureFlag", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns default value when no override", () => {
    const { result } = renderHook(() => useFeatureFlag("test-flag", true));
    expect(result.current).toBe(true);
  });

  it("returns false when default is false", () => {
    const { result } = renderHook(() => useFeatureFlag("test-flag", false));
    expect(result.current).toBe(false);
  });

  it("reads 'true' from localStorage", () => {
    localStorage.setItem("test-flag", "true");
    const { result } = renderHook(() => useFeatureFlag("test-flag", false));
    expect(result.current).toBe(true);
  });

  it("reads '1' from localStorage as true", () => {
    localStorage.setItem("test-flag", "1");
    const { result } = renderHook(() => useFeatureFlag("test-flag", false));
    expect(result.current).toBe(true);
  });

  it("reads 'false' from localStorage as false", () => {
    localStorage.setItem("test-flag", "false");
    const { result } = renderHook(() => useFeatureFlag("test-flag", true));
    expect(result.current).toBe(false);
  });

  it("uses different keys independently", () => {
    localStorage.setItem("flag-a", "true");
    localStorage.setItem("flag-b", "false");
    const { result: a } = renderHook(() => useFeatureFlag("flag-a", false));
    const { result: b } = renderHook(() => useFeatureFlag("flag-b", true));
    expect(a.current).toBe(true);
    expect(b.current).toBe(false);
  });
});
