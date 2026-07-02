import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  const original = document.body.style.overflow;
  afterEach(() => {
    document.body.style.overflow = original;
  });

  it("sets body overflow to hidden when active=true", () => {
    renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not change overflow when active=false", () => {
    document.body.style.overflow = "auto";
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe("auto");
  });

  it("restores prior overflow on unmount", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
