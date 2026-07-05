/**
 * Unit tests for lib/overlay-colors.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { backdrop, surface, getBackdrop, imageOverlay } from "@/lib/overlay-colors";

describe("backdrop", () => {
  it("has sheet property", () => {
    expect(backdrop.sheet).toBeDefined();
    expect(typeof backdrop.sheet).toBe("string");
  });

  it("has dialog property", () => {
    expect(backdrop.dialog).toBeDefined();
    expect(typeof backdrop.dialog).toBe("string");
  });

  it("has tooltip property", () => {
    expect(backdrop.tooltip).toBeDefined();
  });
});

describe("surface", () => {
  it("has card property", () => {
    expect(surface.card).toBeDefined();
    expect(typeof surface.card).toBe("string");
  });

  it("has elevated property", () => {
    expect(surface.elevated).toBeDefined();
  });
});

describe("getBackdrop", () => {
  it("returns string for default opacity", () => {
    const result = getBackdrop();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns string for opacity 40", () => {
    const result = getBackdrop(40);
    expect(typeof result).toBe("string");
  });

  it("returns string for opacity 80", () => {
    const result = getBackdrop(80);
    expect(typeof result).toBe("string");
  });
});

describe("imageOverlay", () => {
  it("returns string", () => {
    const result = imageOverlay();
    expect(typeof result).toBe("string");
  });

  it("handles showOnHover true", () => {
    const result = imageOverlay(true);
    expect(typeof result).toBe("string");
  });

  it("handles showOnHover false", () => {
    const result = imageOverlay(false);
    expect(typeof result).toBe("string");
  });
});
