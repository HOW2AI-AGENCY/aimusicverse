/**
 * Unit tests for lib/utils.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { cn, cnInteractive } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});

describe("cnInteractive", () => {
  it("returns base classes by default", () => {
    const result = cnInteractive();
    expect(result).toContain("cursor-pointer");
  });

  it("includes hover classes when hover is true", () => {
    const result = cnInteractive({ hover: true });
    expect(result).toContain("hover:");
  });

  it("includes ring classes when ring is specified", () => {
    const result = cnInteractive({ ring: "primary" });
    expect(result).toContain("ring");
  });

  it("handles destruct ring", () => {
    const result = cnInteractive({ ring: "destructive" });
    expect(result).toContain("destructive");
  });
});
