import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSafeMotion } from "@/hooks/useSafeMotion";

const mockUseReducedMotion = vi.fn();

vi.mock("@/lib/motion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe("useSafeMotion", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("returns prefersReduced false by default", () => {
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.prefersReduced).toBe(false);
  });

  it("returns prefersReduced true from framer", () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.prefersReduced).toBe(true);
  });

  it("returns shouldAnimate true when no reduced motion", () => {
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.shouldAnimate).toBe(true);
  });

  it("returns shouldAnimate false when reduced motion", () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.shouldAnimate).toBe(false);
  });

  it("animate returns value when no reduced motion", () => {
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.animate({ opacity: 1 })).toEqual({ opacity: 1 });
  });

  it("animate returns empty object when reduced motion", () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.animate({ opacity: 1 })).toEqual({});
  });

  it("prefersReduced is null-safe (treats null as false)", () => {
    mockUseReducedMotion.mockReturnValue(null);
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.shouldAnimate).toBe(true);
  });
});
