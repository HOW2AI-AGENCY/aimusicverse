import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipeActions } from "@/hooks/useSwipeActions";

vi.mock("@/lib/mobile-utils", () => ({
  triggerHapticFeedback: vi.fn(),
}));

function touchEvt(clientX: number, clientY: number): React.TouchEvent {
  return {
    touches: [{ clientX, clientY }],
    preventDefault: vi.fn(),
  } as unknown as React.TouchEvent;
}

describe("useSwipeActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with zero offset, no direction, not open", () => {
    const { result } = renderHook(() => useSwipeActions({}));
    expect(result.current.offset).toBe(0);
    expect(result.current.direction).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it("handlers are stable references", () => {
    const { result } = renderHook(() => useSwipeActions({}));
    expect(result.current.handlers.onTouchStart).toBeDefined();
    expect(result.current.handlers.onTouchMove).toBeDefined();
    expect(result.current.handlers.onTouchEnd).toBeDefined();
  });

  it("does nothing when disabled", () => {
    const { result } = renderHook(() => useSwipeActions({ disabled: true }));
    const startState = { offset: result.current.offset, isOpen: result.current.isOpen };
    act(() => result.current.handlers.onTouchStart(touchEvt(300, 200)));
    act(() => result.current.handlers.onTouchMove(touchEvt(200, 150)));
    expect(result.current.offset).toBe(startState.offset);
    expect(result.current.isOpen).toBe(startState.isOpen);
  });

  it("opens on left swipe past threshold", () => {
    const { result } = renderHook(() =>
      useSwipeActions({
        rightActions: [{ id: "delete", icon: null, label: "", color: "red", onAction: vi.fn() }],
        threshold: 80,
      }),
    );
    act(() => result.current.handlers.onTouchStart(touchEvt(300, 200)));
    act(() => result.current.handlers.onTouchMove(touchEvt(200, 200)));
    act(() => result.current.handlers.onTouchEnd());
    expect(result.current.isOpen).toBe(true);
  });

  it("resets on swipe below threshold", () => {
    const { result } = renderHook(() =>
      useSwipeActions({
        rightActions: [{ id: "delete", icon: null, label: "", color: "red", onAction: vi.fn() }],
        threshold: 80,
      }),
    );
    act(() => result.current.handlers.onTouchStart(touchEvt(300, 200)));
    act(() => result.current.handlers.onTouchMove(touchEvt(290, 200)));
    act(() => result.current.handlers.onTouchEnd());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.offset).toBe(0);
  });

  it("close resets state", () => {
    const onAction = vi.fn();
    const { result } = renderHook(() =>
      useSwipeActions({
        rightActions: [{ id: "delete", icon: null, label: "", color: "red", onAction }],
        threshold: 80,
      }),
    );
    act(() => result.current.handlers.onTouchStart(touchEvt(300, 200)));
    act(() => result.current.handlers.onTouchMove(touchEvt(200, 200)));
    act(() => result.current.handlers.onTouchEnd());
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.offset).toBe(0);
  });

  it("executeAction calls onAction and closes", () => {
    const onAction = vi.fn();
    const { result } = renderHook(() =>
      useSwipeActions({ rightActions: [{ id: "delete", icon: null, label: "", color: "red", onAction }] }),
    );
    act(() => result.current.executeAction("delete"));
    expect(onAction).toHaveBeenCalled();
  });

  it("vertical scroll cancels drag", () => {
    const onAction = vi.fn();
    const { result } = renderHook(() =>
      useSwipeActions({
        rightActions: [{ id: "delete", icon: null, label: "", color: "red", onAction }],
        threshold: 80,
      }),
    );
    act(() => result.current.handlers.onTouchStart(touchEvt(300, 200)));
    act(() => result.current.handlers.onTouchMove(touchEvt(300, 300)));
    expect(result.current.offset).toBe(0);
  });
});
