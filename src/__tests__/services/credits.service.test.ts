/**
 * Unit tests for credits.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLevelFromExperience,
  getExperienceForLevel,
  getLevelProgress,
  ACTION_REWARDS,
} from "@/services/credits.service";

vi.mock("@/api/credits.api", () => ({
  checkAdminStatus: vi.fn(),
  fetchUserCredits: vi.fn(),
  fetchSunoApiBalance: vi.fn(),
  deductCredits: vi.fn(),
  logCreditTransaction: vi.fn(),
  hasCheckedInToday: vi.fn(),
  recordCheckin: vi.fn(),
  fetchCheckinsSince: vi.fn(),
  countCompletedTracks: vi.fn(),
  countUserAchievements: vi.fn(),
  countLikesForTracks: vi.fn(),
  countUserArtists: vi.fn(),
  addCredits: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/economy", () => ({
  ECONOMY: {
    DEFAULT_GENERATION_COST: 10,
    DAILY_CHECKIN: { credits: 5, xp: 10 },
    STREAK_BONUS: { credits_per_day: 2, xp_per_day: 5 },
    SHARE_REWARD: { credits: 3, xp: 5 },
    LIKE_RECEIVED: { credits: 1, xp: 2 },
    GENERATION_COMPLETE: { credits: 0, xp: 15 },
    PUBLIC_TRACK: { credits: 5, xp: 10 },
    ARTIST_CREATED: { credits: 10, xp: 20 },
    PROJECT_CREATED: { credits: 5, xp: 10 },
    PURCHASE_XP_PER_100_STARS: 10,
    SUBSCRIPTION_XP_BONUS: 100,
    FIRST_PURCHASE_BONUS_CREDITS: 50,
    REFERRAL_INVITE_BONUS: 20,
  },
  MODEL_COSTS: {},
}));
vi.mock("@/constants/sunoModels", () => ({
  getModelCost: vi.fn().mockReturnValue(10),
  DEFAULT_GENERATION_COST: 10,
}));

describe("credits.service", () => {
  describe("getLevelFromExperience", () => {
    it("returns level 1 for 0 XP", () => {
      expect(getLevelFromExperience(0)).toBe(1);
    });

    it("returns level 1 for low XP", () => {
      expect(getLevelFromExperience(50)).toBe(1);
    });

    it("returns level 2 at 100 XP", () => {
      expect(getLevelFromExperience(100)).toBe(2);
    });

    it("returns level 3 at 400 XP", () => {
      expect(getLevelFromExperience(400)).toBe(3);
    });

    it("returns higher levels for large XP", () => {
      expect(getLevelFromExperience(10000)).toBeGreaterThan(5);
    });

    it("returns at least 1 for very small XP", () => {
      expect(getLevelFromExperience(0)).toBe(1);
      expect(getLevelFromExperience(1)).toBe(1);
    });
  });

  describe("getExperienceForLevel", () => {
    it("returns 0 for level 1", () => {
      expect(getExperienceForLevel(1)).toBe(0);
    });

    it("returns 100 for level 2", () => {
      expect(getExperienceForLevel(2)).toBe(100);
    });

    it("returns 400 for level 3", () => {
      expect(getExperienceForLevel(3)).toBe(400);
    });

    it("returns 900 for level 4", () => {
      expect(getExperienceForLevel(4)).toBe(900);
    });

    it("is monotonically increasing", () => {
      for (let i = 2; i <= 10; i++) {
        expect(getExperienceForLevel(i)).toBeGreaterThan(getExperienceForLevel(i - 1));
      }
    });
  });

  describe("getLevelProgress", () => {
    it("returns 0% progress at level start", () => {
      const result = getLevelProgress(0);
      expect(result.level).toBe(1);
      expect(result.progress).toBe(0);
    });

    it("returns 100% progress at level boundary", () => {
      // 100 XP = exactly level 2 start = 100% of level 1
      const result = getLevelProgress(100);
      expect(result.level).toBe(2);
      expect(result.progress).toBe(0);
    });

    it("returns ~50% progress at midpoint", () => {
      // Level 1: 0-100 XP, midpoint = 50 XP
      // progress = (50 - 0) / (100 - 0) * 100 = 50%
      const result = getLevelProgress(50);
      expect(result.level).toBe(1);
      expect(result.progress).toBeCloseTo(50, 0);
    });

    it("clamps progress between 0 and 100", () => {
      const result = getLevelProgress(999999);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it("returns correct current and next XP thresholds", () => {
      const result = getLevelProgress(250);
      expect(result.current).toBe(getExperienceForLevel(result.level));
      expect(result.next).toBe(getExperienceForLevel(result.level + 1));
    });
  });

  describe("ACTION_REWARDS", () => {
    it("has all expected action types", () => {
      expect(ACTION_REWARDS.checkin).toBeDefined();
      expect(ACTION_REWARDS.streak_bonus).toBeDefined();
      expect(ACTION_REWARDS.share).toBeDefined();
      expect(ACTION_REWARDS.like_received).toBeDefined();
      expect(ACTION_REWARDS.generation_complete).toBeDefined();
      expect(ACTION_REWARDS.public_track).toBeDefined();
      expect(ACTION_REWARDS.artist_created).toBeDefined();
      expect(ACTION_REWARDS.project_created).toBeDefined();
      expect(ACTION_REWARDS.purchase_credits).toBeDefined();
      expect(ACTION_REWARDS.purchase_subscription).toBeDefined();
      expect(ACTION_REWARDS.first_purchase).toBeDefined();
      expect(ACTION_REWARDS.referral_signup).toBeDefined();
      expect(ACTION_REWARDS.referral_purchase).toBeDefined();
    });

    it("each action has credits, experience, and description", () => {
      for (const [key, value] of Object.entries(ACTION_REWARDS)) {
        expect(value).toHaveProperty("credits");
        expect(value).toHaveProperty("experience");
        expect(value).toHaveProperty("description");
        expect(typeof value.description).toBe("string");
      }
    });
  });
});
