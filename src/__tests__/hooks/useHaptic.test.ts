import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHaptic } from "@/hooks/useHaptic";

const mockImpact = vi.fn();
const mockNotification = vi.fn();
const mockSelectionChanged = vi.fn();

vi.mock("@/lib/haptic", () => ({
  hapticImpact: (...args: unknown[]) => mockImpact(...args),
  hapticNotification: (...args: unknown[]) => mockNotification(...args),
  hapticSelectionChanged: (...args: unknown[]) => mockSelectionChanged(...args),
  isHapticAvailable: () => true,
}));

describe("useHaptic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isAvailable true", () => {
    const { result } = renderHook(() => useHaptic());
    expect(result.current.isAvailable).toBe(true);
  });

  it("impact calls hapticImpact with default medium", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.impact();
    expect(mockImpact).toHaveBeenCalledWith("medium");
  });

  it("impact passes style through", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.impact("heavy");
    expect(mockImpact).toHaveBeenCalledWith("heavy");
  });

  it("notification calls hapticNotification with default success", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.notification();
    expect(mockNotification).toHaveBeenCalledWith("success");
  });

  it("notification passes type through", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.notification("error");
    expect(mockNotification).toHaveBeenCalledWith("error");
  });

  it("selectionChanged calls hapticSelectionChanged", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.selectionChanged();
    expect(mockSelectionChanged).toHaveBeenCalled();
  });

  it("patterns.tap triggers light impact", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.patterns.tap();
    expect(mockImpact).toHaveBeenCalledWith("light");
  });

  it("patterns.success triggers success notification", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.patterns.success();
    expect(mockNotification).toHaveBeenCalledWith("success");
  });

  it("patterns.error triggers error notification", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.patterns.error();
    expect(mockNotification).toHaveBeenCalledWith("error");
  });

  it("patterns.delete triggers heavy impact", () => {
    const { result } = renderHook(() => useHaptic());
    result.current.patterns.delete();
    expect(mockImpact).toHaveBeenCalledWith("heavy");
  });
});
