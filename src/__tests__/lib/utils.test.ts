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
    expect(result).toContain("transition-[transform,background-color,border-color,box-shadow]");
    expect(result).toContain("duration-200");
    expect(result).toContain("active:scale-[0.97]");
  });

  it("includes hover classes when hover is true (default)", () => {
    const result = cnInteractive({ hover: true });
    expect(result).toContain("hover:-translate-y-0.5");
    expect(result).toContain("hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.35)]");
  });

  it("excludes hover classes when hover is false", () => {
    const result = cnInteractive({ hover: false });
    expect(result).not.toContain("hover:");
  });

  it("includes primary ring classes by default", () => {
    const result = cnInteractive();
    expect(result).toContain("focus-visible:ring-primary/60");
  });

  it("includes destructive ring classes when specified", () => {
    const result = cnInteractive({ ring: "destructive" });
    expect(result).toContain("focus-visible:ring-destructive/60");
    expect(result).not.toContain("focus-visible:ring-primary/60");
  });

  it("includes focus-visible classes", () => {
    const result = cnInteractive();
    expect(result).toContain("focus-visible:outline-none");
    expect(result).toContain("focus-visible:ring-2");
  });
});
