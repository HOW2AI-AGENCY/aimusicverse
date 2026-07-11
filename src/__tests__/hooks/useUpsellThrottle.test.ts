import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUpsellThrottle } from "@/hooks/useUpsellThrottle";

const mockCanShow = vi.fn();
const mockRecordShown = vi.fn();

vi.mock("@/services/upsell-strategy.service", () => ({
  canShowUpsell: (type: string) => mockCanShow(type),
  recordUpsellShown: (type: string) => mockRecordShown(type),
}));

describe("useUpsellThrottle", () => {
  it("returns canShow from service", () => {
    mockCanShow.mockReturnValue(true);
    const { result } = renderHook(() => useUpsellThrottle("banner"));
    expect(result.current.canShow).toBe(true);
  });

  it("returns false when service says no", () => {
    mockCanShow.mockReturnValue(false);
    const { result } = renderHook(() => useUpsellThrottle("paywall"));
    expect(result.current.canShow).toBe(false);
  });

  it("recordShown delegates to service", () => {
    const { result } = renderHook(() => useUpsellThrottle("badge"));
    result.current.recordShown();
    expect(mockRecordShown).toHaveBeenCalledWith("badge");
  });

  it("returns memoized canShow for same type", () => {
    mockCanShow.mockReturnValue(true);
    const { result, rerender } = renderHook(() => useUpsellThrottle("banner"));
    const first = result.current.canShow;
    rerender();
    expect(result.current.canShow).toBe(first);
  });
});
