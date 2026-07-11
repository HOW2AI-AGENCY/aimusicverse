import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoLoadMore } from "@/hooks/useAutoLoadMore";

// Mock react's useRef to provide a non-null sentinel ref
const FAKE_DIV = document.createElement("div");
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useRef: vi.fn(() => ({ current: FAKE_DIV })),
  };
});

describe("useAutoLoadMore", () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: ((entries: { isIntersecting: boolean }[]) => void) | null;

  beforeEach(() => {
    observerCallback = null;
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    globalThis.IntersectionObserver = vi.fn(function (this: unknown, cb: IntersectionObserverCallback) {
      observerCallback = cb as unknown as typeof observerCallback;
      return { observe: mockObserve, disconnect: mockDisconnect, rootMargin: "" } as unknown as IntersectionObserver;
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates observer when hasMore and not loading", () => {
    renderHook(() => useAutoLoadMore({ hasMore: true, isLoading: false, onLoadMore: vi.fn() }));
    expect(mockObserve).toHaveBeenCalledWith(FAKE_DIV);
  });

  it("skips observer when hasMore is false", () => {
    renderHook(() => useAutoLoadMore({ hasMore: false, isLoading: false, onLoadMore: vi.fn() }));
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("skips observer when isLoading is true", () => {
    renderHook(() => useAutoLoadMore({ hasMore: true, isLoading: true, onLoadMore: vi.fn() }));
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("skips observer when disabled is true", () => {
    renderHook(() => useAutoLoadMore({ hasMore: true, isLoading: false, onLoadMore: vi.fn(), disabled: true }));
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("calls onLoadMore when sentinel enters viewport", () => {
    const onLoadMore = vi.fn();
    renderHook(() => useAutoLoadMore({ hasMore: true, isLoading: false, onLoadMore }));
    observerCallback?.([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("disconnects observer on unmount", () => {
    const { unmount } = renderHook(() => useAutoLoadMore({ hasMore: true, isLoading: false, onLoadMore: vi.fn() }));
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
