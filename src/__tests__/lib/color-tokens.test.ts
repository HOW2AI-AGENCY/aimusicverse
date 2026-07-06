/**
 * Unit tests for lib/color-tokens.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getSectionColor, getStateColor } from "@/lib/color-tokens";

describe("getSectionColor", () => {
  it("returns string for generate section", () => {
    expect(typeof getSectionColor("generate")).toBe("string");
  });

  it("returns string for library section", () => {
    expect(typeof getSectionColor("library")).toBe("string");
  });

  it("returns string for projects section", () => {
    expect(typeof getSectionColor("projects")).toBe("string");
  });

  it("returns string for community section", () => {
    expect(typeof getSectionColor("community")).toBe("string");
  });
});

describe("getStateColor", () => {
  it("returns string for success state", () => {
    expect(typeof getStateColor("success")).toBe("string");
  });

  it("returns string for warning state", () => {
    expect(typeof getStateColor("warning")).toBe("string");
  });

  it("returns string for danger state", () => {
    expect(typeof getStateColor("danger")).toBe("string");
  });
});
