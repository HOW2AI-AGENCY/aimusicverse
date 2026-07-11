import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getTelegramSafeAreaInsets,
  getTelegramSafeAreaCSS,
  getTelegramHeaderPaddingTop,
  wouldCollideWithSafeArea,
} from "@/lib/telegramSafeArea";

describe("telegramSafeArea", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getTelegramSafeAreaInsets returns zeroes when no CSS vars set", () => {
    const insets = getTelegramSafeAreaInsets();
    expect(insets).toEqual({ top: 0, bottom: 0, left: 0, right: 0, contentTop: 0 });
  });

  it("getTelegramSafeAreaCSS returns calc expression for top", () => {
    const css = getTelegramSafeAreaCSS("top");
    expect(css).toContain("safe-area-inset-top");
    expect(css).toContain("calc");
  });

  it("getTelegramSafeAreaCSS returns env expression for bottom", () => {
    const css = getTelegramSafeAreaCSS("bottom");
    expect(css).toContain("safe-area-inset-bottom");
  });

  it("getTelegramSafeAreaCSS returns env expression for left", () => {
    const css = getTelegramSafeAreaCSS("left");
    expect(css).toBe("env(safe-area-inset-left, 0px)");
  });

  it("getTelegramSafeAreaCSS returns env expression for right", () => {
    const css = getTelegramSafeAreaCSS("right");
    expect(css).toBe("env(safe-area-inset-right, 0px)");
  });

  it("getTelegramHeaderPaddingTop returns calc with extra", () => {
    const css = getTelegramHeaderPaddingTop(8);
    expect(css).toContain("+ 8px");
  });

  it("wouldCollideWithSafeArea returns false when element out of range", () => {
    const rect = new DOMRect(0, 200, 100, 50);
    expect(wouldCollideWithSafeArea("top", rect)).toBe(false);
  });

  it("wouldCollideWithSafeArea returns false without rect", () => {
    expect(wouldCollideWithSafeArea("top")).toBe(false);
  });
});
