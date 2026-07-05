/**
 * Unit tests for lib/color-tokens.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getSectionColor, getSurfaceColor, getStateColor, getUIColor, isLightColor } from "@/lib/color-tokens";

describe("getSectionColor", () => {
  it("returns string for intro", () => {
    expect(typeof getSectionColor("intro")).toBe("string");
  });

  it("returns string for verse", () => {
    expect(typeof getSectionColor("verse")).toBe("string");
  });

  it("returns string for chorus", () => {
    expect(typeof getSectionColor("chorus")).toBe("string");
  });
});

describe("getSurfaceColor", () => {
  it("returns string for level 1", () => {
    expect(typeof getSurfaceColor(1)).toBe("string");
  });

  it("returns string for level 2", () => {
    expect(typeof getSurfaceColor(2)).toBe("string");
  });

  it("returns string for level 3", () => {
    expect(typeof getSurfaceColor(3)).toBe("string");
  });
});

describe("getStateColor", () => {
  it("returns string for success", () => {
    expect(typeof getStateColor("success")).toBe("string");
  });

  it("returns string for error", () => {
    expect(typeof getStateColor("error")).toBe("string");
  });

  it("returns string for warning", () => {
    expect(typeof getStateColor("warning")).toBe("string");
  });
});

describe("getUIColor", () => {
  it("returns string for primary", () => {
    expect(typeof getUIColor("primary")).toBe("string");
  });

  it("returns string for secondary", () => {
    expect(typeof getUIColor("secondary")).toBe("string");
  });
});

describe("isLightColor", () => {
  it("returns true for white", () => {
    expect(isLightColor("#FFFFFF")).toBe(true);
  });

  it("returns false for black", () => {
    expect(isLightColor("#000000")).toBe(false);
  });

  it("returns true for light gray", () => {
    expect(isLightColor("#CCCCCC")).toBe(true);
  });

  it("returns false for dark gray", () => {
    expect(isLightColor("#333333")).toBe(false);
  });
});
