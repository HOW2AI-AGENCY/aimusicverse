/**
 * Unit tests for lib/glass.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getGlass } from "@/lib/glass";

describe("getGlass", () => {
  it("returns a string for subtle preset", () => {
    const result = getGlass("subtle");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes rounded class when specified", () => {
    const result = getGlass("subtle", { rounded: "xl" });
    expect(result).toContain("rounded-xl");
  });

  it("includes interactive classes when interactive is true", () => {
    const result = getGlass("subtle", { interactive: true });
    expect(result).toContain("cursor-pointer");
  });

  it("includes selected ring when selected is true", () => {
    const result = getGlass("subtle", { selected: true });
    expect(result).toContain("ring-2");
  });

  it("includes hover glow when hoverGlow is true", () => {
    const result = getGlass("subtle", { hoverGlow: true });
    expect(result).toContain("hover:ring-1");
  });

  it("handles no modifiers", () => {
    const result = getGlass("subtle");
    expect(result).not.toContain("cursor-pointer");
    expect(result).not.toContain("ring-2");
  });
});
