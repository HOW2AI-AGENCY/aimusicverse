/**
 * Unit tests for lib/validation/touchTargets.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getTouchTargetClasses } from "@/lib/validation/touchTargets";

describe("getTouchTargetClasses", () => {
  it("returns string for default size", () => {
    const result = getTouchTargetClasses();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns string for size 44", () => {
    const result = getTouchTargetClasses(44);
    expect(typeof result).toBe("string");
  });

  it("returns string for size 48", () => {
    const result = getTouchTargetClasses(48);
    expect(typeof result).toBe("string");
  });

  it("returns string for size 56", () => {
    const result = getTouchTargetClasses(56);
    expect(typeof result).toBe("string");
  });
});
