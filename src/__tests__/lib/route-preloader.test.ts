/**
 * Unit tests for lib/route-preloader.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { isRoutePreloaded } from "@/lib/route-preloader";

describe("isRoutePreloaded", () => {
  it("returns false for non-preloaded route", () => {
    expect(isRoutePreloaded("/nonexistent")).toBe(false);
  });

  it("returns boolean for any route", () => {
    expect(typeof isRoutePreloaded("/")).toBe("boolean");
  });
});
