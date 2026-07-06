/**
 * Unit tests for studio-sections.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  inferSectionType,
  getSectionColor,
  createFallbackSections,
  validateSectionBounds,
} from "@/services/studio/studio-sections.service";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/api/studio.api", () => ({
  fetchReplacedSectionTasks: vi.fn(),
  fetchSectionReplacementLogs: vi.fn(),
}));

describe("studio-sections.service", () => {
  describe("inferSectionType", () => {
    it("infers intro from label", () => {
      expect(inferSectionType(0, 5, 10, "Intro")).toBe("intro");
    });

    it("infers verse from label", () => {
      expect(inferSectionType(1, 5, 30, "Verse 1")).toBe("verse");
    });

    it("infers chorus from label", () => {
      expect(inferSectionType(2, 5, 30, "Chorus")).toBe("chorus");
    });

    it("infers bridge from label", () => {
      expect(inferSectionType(3, 5, 30, "Bridge")).toBe("bridge");
    });

    it("infers outro from label", () => {
      expect(inferSectionType(4, 5, 30, "Outro")).toBe("outro");
    });

    it("infers instrumental from label", () => {
      expect(inferSectionType(2, 5, 30, "Instrumental")).toBe("instrumental");
    });

    it("falls back to position-based inference when no label", () => {
      expect(inferSectionType(0, 5, 10)).toBe("intro");
      expect(inferSectionType(4, 5, 15)).toBe("outro");
      expect(inferSectionType(0, 5, 30)).toBe("verse");
      expect(inferSectionType(1, 5, 30)).toBe("chorus");
    });
  });

  describe("getSectionColor", () => {
    it("returns color for each section type", () => {
      const types = ["intro", "verse", "chorus", "bridge", "outro", "instrumental", "unknown"] as const;
      for (const type of types) {
        expect(getSectionColor(type)).toBeTruthy();
      }
    });

    it("returns unknown color for invalid type", () => {
      expect(getSectionColor("unknown" as any)).toBeTruthy();
    });
  });

  describe("createFallbackSections", () => {
    it("returns empty for zero duration", () => {
      expect(createFallbackSections(0)).toEqual([]);
    });

    it("returns empty for negative duration", () => {
      expect(createFallbackSections(-5)).toEqual([]);
    });

    it("creates sections for short track (<60s)", () => {
      const sections = createFallbackSections(45);
      expect(sections.length).toBeGreaterThanOrEqual(1);
      // First section may be intro or verse depending on duration math
      expect(sections[0].type).toBeTruthy();
    });

    it("creates sections for long track (>=60s)", () => {
      const sections = createFallbackSections(180);
      expect(sections.length).toBe(6);
      expect(sections[0].type).toBe("intro");
      expect(sections[5].type).toBe("outro");
    });

    it("sections cover full duration", () => {
      const sections = createFallbackSections(180);
      expect(sections[0].start).toBe(0);
      expect(sections[sections.length - 1].end).toBe(180);
    });
  });

  describe("validateSectionBounds", () => {
    it("rejects negative start", () => {
      const result = validateSectionBounds({ start: -1, end: 10 }, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("rejects end exceeding duration", () => {
      const result = validateSectionBounds({ start: 0, end: 101 }, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("rejects start >= end", () => {
      const result = validateSectionBounds({ start: 10, end: 10 }, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("before");
    });

    it("rejects section shorter than 5 seconds", () => {
      const result = validateSectionBounds({ start: 0, end: 3 }, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("5 seconds");
    });

    it("rejects section exceeding max duration", () => {
      const result = validateSectionBounds({ start: 0, end: 60 }, 100, 30);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceed");
    });

    it("accepts valid bounds", () => {
      const result = validateSectionBounds({ start: 10, end: 30 }, 100);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
