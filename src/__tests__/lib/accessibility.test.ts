/**
 * Unit tests for lib/accessibility.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { contrastUtils, getSkipLinkProps } from "@/lib/accessibility";

describe("contrastUtils.getLuminance", () => {
  it("returns 1 for white (255,255,255)", () => {
    const lum = contrastUtils.getLuminance(255, 255, 255);
    expect(lum).toBeCloseTo(1, 1);
  });

  it("returns 0 for black (0,0,0)", () => {
    const lum = contrastUtils.getLuminance(0, 0, 0);
    expect(lum).toBeCloseTo(0, 2);
  });

  it("returns ~0.21 for pure red", () => {
    const lum = contrastUtils.getLuminance(255, 0, 0);
    expect(lum).toBeCloseTo(0.2126, 2);
  });

  it("returns ~0.72 for pure green", () => {
    const lum = contrastUtils.getLuminance(0, 255, 0);
    expect(lum).toBeCloseTo(0.7152, 2);
  });

  it("returns ~0.07 for pure blue", () => {
    const lum = contrastUtils.getLuminance(0, 0, 255);
    expect(lum).toBeCloseTo(0.0722, 2);
  });
});

describe("contrastUtils.getContrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    const ratio = contrastUtils.getContrastRatio(1, 0);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for same luminance", () => {
    const ratio = contrastUtils.getContrastRatio(0.5, 0.5);
    expect(ratio).toBeCloseTo(1, 1);
  });

  it("handles lighter first", () => {
    const ratio = contrastUtils.getContrastRatio(0.8, 0.2);
    expect(ratio).toBeGreaterThan(1);
  });

  it("handles darker first", () => {
    const ratio = contrastUtils.getContrastRatio(0.2, 0.8);
    expect(ratio).toBeGreaterThan(1);
  });
});

describe("contrastUtils.meetsWCAG_AA", () => {
  it("passes for 4.5:1 normal text", () => {
    expect(contrastUtils.meetsWCAG_AA(4.5)).toBe(true);
  });

  it("fails for 4:1 normal text", () => {
    expect(contrastUtils.meetsWCAG_AA(4)).toBe(false);
  });

  it("passes for 3:1 large text", () => {
    expect(contrastUtils.meetsWCAG_AA(3, true)).toBe(true);
  });

  it("fails for 2.5:1 large text", () => {
    expect(contrastUtils.meetsWCAG_AA(2.5, true)).toBe(false);
  });
});

describe("contrastUtils.meetsWCAG_AAA", () => {
  it("passes for 7:1 normal text", () => {
    expect(contrastUtils.meetsWCAG_AAA(7)).toBe(true);
  });

  it("fails for 6:1 normal text", () => {
    expect(contrastUtils.meetsWCAG_AAA(6)).toBe(false);
  });

  it("passes for 4.5:1 large text", () => {
    expect(contrastUtils.meetsWCAG_AAA(4.5, true)).toBe(true);
  });

  it("fails for 4:1 large text", () => {
    expect(contrastUtils.meetsWCAG_AAA(4, true)).toBe(false);
  });
});

describe("getSkipLinkProps", () => {
  it("returns default props", () => {
    const props = getSkipLinkProps();
    expect(props.href).toBe("#main-content");
    expect(props.className).toBe("skip-to-content");
    expect(props.children).toContain("основному");
  });

  it("accepts custom href", () => {
    const props = getSkipLinkProps("#custom");
    expect(props.href).toBe("#custom");
  });

  it("accepts custom text", () => {
    const props = getSkipLinkProps("#main", "Skip to content");
    expect(props.children).toBe("Skip to content");
  });
});
