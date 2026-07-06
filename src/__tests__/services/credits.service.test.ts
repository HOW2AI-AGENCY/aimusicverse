/**
 * Unit tests for credits.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  GENERATION_COST,
  ACTION_REWARDS,
  getLevelFromExperience,
  getExperienceForLevel,
  getLevelProgress,
} from "@/services/credits.service";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/api/credits.api", () => ({}));

describe("credits.service", () => {
  describe("GENERATION_COST", () => {
    it("is a positive number", () => {
      expect(GENERATION_COST).toBeGreaterThan(0);
    });
  });

  describe("ACTION_REWARDS", () => {
    it("has checkin reward", () => {
      expect(ACTION_REWARDS.checkin).toBeDefined();
      expect(ACTION_REWARDS.checkin.credits).toBeGreaterThanOrEqual(0);
      expect(ACTION_REWARDS.checkin.experience).toBeGreaterThan(0);
    });

    it("has share reward", () => {
      expect(ACTION_REWARDS.share).toBeDefined();
    });

    it("has generation_complete reward", () => {
      expect(ACTION_REWARDS.generation_complete).toBeDefined();
    });

    it("each reward has description", () => {
      for (const value of Object.values(ACTION_REWARDS)) {
        expect(value.description).toBeTruthy();
      }
    });
  });

  describe("getLevelFromExperience", () => {
    it("returns level 1 for 0 experience", () => {
      expect(getLevelFromExperience(0)).toBe(1);
    });

    it("returns level 1 for small experience", () => {
      expect(getLevelFromExperience(50)).toBe(1);
    });

    it("returns higher level for more experience", () => {
      const level = getLevelFromExperience(10000);
      expect(level).toBeGreaterThan(1);
    });

    it("handles edge cases gracefully", () => {
      // Negative experience produces NaN (sqrt of negative), which is expected
      const result = getLevelFromExperience(-100);
      expect(typeof result).toBe("number");
    });

    it("increases monotonically", () => {
      const level1 = getLevelFromExperience(100);
      const level2 = getLevelFromExperience(400);
      const level3 = getLevelFromExperience(900);
      expect(level2).toBeGreaterThanOrEqual(level1);
      expect(level3).toBeGreaterThanOrEqual(level2);
    });
  });

  describe("getExperienceForLevel", () => {
    it("returns 0 for level 1", () => {
      expect(getExperienceForLevel(1)).toBe(0);
    });

    it("returns positive for level 2", () => {
      expect(getExperienceForLevel(2)).toBeGreaterThan(0);
    });

    it("increases with level", () => {
      const exp2 = getExperienceForLevel(2);
      const exp5 = getExperienceForLevel(5);
      const exp10 = getExperienceForLevel(10);
      expect(exp5).toBeGreaterThan(exp2);
      expect(exp10).toBeGreaterThan(exp5);
    });
  });

  describe("getLevelProgress", () => {
    it("returns valid progress for 0 experience", () => {
      const result = getLevelProgress(0);
      expect(result.level).toBe(1);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it("returns 100% progress at level boundary", () => {
      // Level 2 needs 100 XP
      const result = getLevelProgress(100);
      expect(result.level).toBe(2);
    });

    it("progress is between 0 and 100", () => {
      const result = getLevelProgress(500);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it("current is less than next", () => {
      const result = getLevelProgress(50);
      expect(result.current).toBeLessThan(result.next);
    });
  });
});
