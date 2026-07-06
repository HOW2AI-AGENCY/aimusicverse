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

  it("has light property", () => {
    expect(backdrop.light).toBeDefined();
    expect(typeof backdrop.light).toBe("string");
  });

  it("has medium property", () => {
    expect(backdrop.medium).toBeDefined();
    expect(typeof backdrop.medium).toBe("string");
  });
});

describe("surface", () => {
  it("has subtle property", () => {
    expect(surface.subtle).toBeDefined();
    expect(typeof surface.subtle).toBe("string");
  });

  it("has light property", () => {
    expect(surface.light).toBeDefined();
    expect(typeof surface.light).toBe("string");
  });

  it("has medium property", () => {
    expect(surface.medium).toBeDefined();
    expect(typeof surface.medium).toBe("string");
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
