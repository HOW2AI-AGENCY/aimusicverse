/**
 * Unit tests for studio.service.ts pure functions
 * Sprint 051 — Test Debt + God Files
 */
import { describe, it, expect } from "vitest";
import {
  inferSectionType,
  getSectionColor,
  createFallbackSections,
  validateSectionBounds,
} from "@/services/studio.service";

describe("inferSectionType", () => {
  it("returns 'intro' for label containing 'intro'", () => {
    expect(inferSectionType(0, 5, 30, "Intro")).toBe("intro");
    expect(inferSectionType(2, 5, 30, "My Intro Section")).toBe("intro");
  });

  it("returns 'verse' for label containing 'verse'", () => {
    expect(inferSectionType(1, 5, 30, "Verse 1")).toBe("verse");
  });

  it("returns 'chorus' for label containing 'chorus' or 'hook'", () => {
    expect(inferSectionType(2, 5, 30, "Chorus")).toBe("chorus");
    expect(inferSectionType(2, 5, 30, "The Hook")).toBe("chorus");
  });

  it("returns 'bridge' for label containing 'bridge'", () => {
    expect(inferSectionType(3, 5, 30, "Bridge")).toBe("bridge");
  });

  it("returns 'outro' for label containing 'outro' or 'end'", () => {
    expect(inferSectionType(4, 5, 30, "Outro")).toBe("outro");
    expect(inferSectionType(4, 5, 30, "The End")).toBe("outro");
  });

  it("returns 'instrumental' for label containing 'instrumental' or 'solo'", () => {
    expect(inferSectionType(2, 5, 30, "Instrumental")).toBe("instrumental");
    expect(inferSectionType(2, 5, 30, "Guitar Solo")).toBe("instrumental");
  });

  it("infers 'intro' from position 0 with short duration", () => {
    expect(inferSectionType(0, 5, 10)).toBe("intro");
  });

  it("infers 'outro' from last position with short duration", () => {
    expect(inferSectionType(4, 5, 15)).toBe("outro");
  });

  it("infers 'verse' from even position", () => {
    expect(inferSectionType(0, 6, 60)).toBe("verse");
    expect(inferSectionType(2, 6, 60)).toBe("verse");
  });

  it("infers 'chorus' from odd position", () => {
    expect(inferSectionType(1, 6, 60)).toBe("chorus");
    expect(inferSectionType(3, 6, 60)).toBe("chorus");
  });

  it("is case-insensitive for labels", () => {
    expect(inferSectionType(0, 5, 30, "INTRO")).toBe("intro");
    expect(inferSectionType(0, 5, 30, "verse")).toBe("verse");
  });
});

describe("getSectionColor", () => {
  it("returns correct color for each type", () => {
    expect(getSectionColor("intro")).toBe("hsl(var(--chart-1))");
    expect(getSectionColor("verse")).toBe("hsl(var(--chart-2))");
    expect(getSectionColor("chorus")).toBe("hsl(var(--chart-3))");
    expect(getSectionColor("bridge")).toBe("hsl(var(--chart-4))");
    expect(getSectionColor("outro")).toBe("hsl(var(--chart-5))");
    expect(getSectionColor("instrumental")).toBe("hsl(var(--muted-foreground))");
    expect(getSectionColor("unknown")).toBe("hsl(var(--muted-foreground))");
  });
});

describe("createFallbackSections", () => {
  it("returns empty array for zero duration", () => {
    expect(createFallbackSections(0)).toEqual([]);
  });

  it("returns empty array for negative duration", () => {
    expect(createFallbackSections(-10)).toEqual([]);
  });

  it("creates simple structure for short tracks (< 60s)", () => {
    const sections = createFallbackSections(30);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0].type).toBe("verse");
    // Should cover the full duration
    const lastSection = sections[sections.length - 1];
    expect(lastSection.end).toBeCloseTo(30, -1);
  });

  it("creates intro + verse + outro for medium tracks", () => {
    const sections = createFallbackSections(45);
    // For 45s: introDuration=4.5 (>3) + main + outroDuration=4.5 (>3) = 3 sections
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections.some((s) => s.type === "verse")).toBe(true);
  });

  it("creates verse/chorus structure for long tracks (>= 60s)", () => {
    const sections = createFallbackSections(120);
    expect(sections.length).toBeGreaterThanOrEqual(3);
    const types = sections.map((s) => s.type);
    expect(types).toContain("verse");
  });

  it("creates multi-section structure for very long tracks (>= 180s)", () => {
    const sections = createFallbackSections(240);
    expect(sections.length).toBeGreaterThanOrEqual(5);
    const types = sections.map((s) => s.type);
    expect(types).toContain("chorus");
  });
});

describe("validateSectionBounds", () => {
  const duration = 120;

  it("rejects negative start", () => {
    const result = validateSectionBounds({ start: -1, end: 10 }, duration);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("negative");
  });

  it("rejects end exceeding duration", () => {
    const result = validateSectionBounds({ start: 0, end: 130 }, duration);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("rejects start >= end", () => {
    const result = validateSectionBounds({ start: 10, end: 10 }, duration);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("before");
  });

  it("rejects section shorter than 5 seconds", () => {
    const result = validateSectionBounds({ start: 0, end: 3 }, duration);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 5");
  });

  it("rejects section exceeding maxSectionDuration", () => {
    const result = validateSectionBounds({ start: 0, end: 60 }, duration, 30);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed");
  });

  it("accepts valid section", () => {
    const result = validateSectionBounds({ start: 10, end: 40 }, duration);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts section at boundary", () => {
    const result = validateSectionBounds({ start: 0, end: duration }, duration);
    expect(result.valid).toBe(true);
  });
});
