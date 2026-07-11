import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll when active", () => {
    renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not lock when inactive", () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("restores previous overflow on unmount", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("restores previous overflow when deactivated", () => {
    document.body.style.overflow = "auto";
    const { rerender } = renderHook(({ active }: { active: boolean }) => useScrollLock(active), {
      initialProps: { active: true },
    });
    expect(document.body.style.overflow).toBe("hidden");
    rerender({ active: false });
    expect(document.body.style.overflow).toBe("auto");
  });
});
