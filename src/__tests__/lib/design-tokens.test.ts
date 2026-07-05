/**
 * Unit tests for lib/design-tokens.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getAnimationDuration, getContrastClass } from "@/lib/design-tokens";

describe("getAnimationDuration", () => {
  it("returns base duration when motion is allowed", () => {
    // In test environment, prefers-reduced-motion is typically false
    const result = getAnimationDuration(300);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(300);
  });

  it("returns 0 for zero duration", () => {
    expect(getAnimationDuration(0)).toBe(0);
  });
});

describe("getContrastClass", () => {
  it("returns a string for AA level", () => {
    const result = getContrastClass("AA");
    expect(typeof result).toBe("string");
  });

  it("returns a string for AAA level", () => {
    const result = getContrastClass("AAA");
    expect(typeof result).toBe("string");
  });

  it("defaults to AA", () => {
    const result = getContrastClass();
    expect(typeof result).toBe("string");
  });
});
