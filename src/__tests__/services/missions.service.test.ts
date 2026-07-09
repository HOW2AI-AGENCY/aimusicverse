/**
 * Unit tests for gamification/missions.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as creditsApi from "@/api/credits.api";
import * as tracksApi from "@/api/tracks.api";
import * as paymentsApi from "@/api/payments.api";

vi.mock("@/api/credits.api", () => ({
  countTracksCreatedBetween: vi.fn(),
  countUserActivityBetween: vi.fn(),
  countUserTrackLikesBetween: vi.fn(),
  fetchTodayCheckin: vi.fn(),
  fetchClaimedMissionActions: vi.fn(),
  countLikesForTracks: vi.fn(),
  countUserArtists: vi.fn(),
  countUserAchievements: vi.fn(),
  countLikesForTracksBetween: vi.fn(),
  invokeRewardAction: vi.fn(),
  fetchCheckinsSince: vi.fn(),
  countCompletedTracks: vi.fn(),
  countUserAchievements: vi.fn(),
}));

vi.mock("@/api/tracks.api", () => ({
  fetchTracks: vi.fn(),
}));

vi.mock("@/api/payments.api", () => ({
  getUserCredits: vi.fn(),
}));

import {
  fetchDailyActivity,
  claimMissionReward,
  fetchStreakCalendarDays,
  fetchQuickStats,
  fetchSpecialChallengeStats,
  fetchWeeklyChallengeStats,
} from "@/services/gamification/missions.service";

describe("missions.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDailyActivity", () => {
    it("aggregates daily counts and claimed missions", async () => {
      vi.mocked(creditsApi.countTracksCreatedBetween).mockResolvedValue(3);
      vi.mocked(creditsApi.countUserActivityBetween).mockResolvedValue(1);
      vi.mocked(creditsApi.countUserTrackLikesBetween).mockResolvedValue(5);
      vi.mocked(creditsApi.fetchTodayCheckin).mockResolvedValue({ id: "c1" });
      vi.mocked(creditsApi.fetchClaimedMissionActions).mockResolvedValue([
        { action_type: "mission_m1" },
        { action_type: "mission_m2" },
      ]);

      const result = await fetchDailyActivity("uid", "2026-07-09");

      expect(result.generations).toBe(3);
      expect(result.shares).toBe(1);
      expect(result.likes).toBe(5);
      expect(result.checkedIn).toBe(true);
      expect(result.claimedIds.has("m1")).toBe(true);
      expect(result.claimedIds.has("m2")).toBe(true);
    });

    it("returns zeroes with no checkin when API returns empty", async () => {
      vi.mocked(creditsApi.countTracksCreatedBetween).mockResolvedValue(0);
      vi.mocked(creditsApi.countUserActivityBetween).mockResolvedValue(0);
      vi.mocked(creditsApi.countUserTrackLikesBetween).mockResolvedValue(0);
      vi.mocked(creditsApi.fetchTodayCheckin).mockResolvedValue(null);
      vi.mocked(creditsApi.fetchClaimedMissionActions).mockResolvedValue([]);

      const result = await fetchDailyActivity("uid", "2026-07-09");

      expect(result.generations).toBe(0);
      expect(result.checkedIn).toBe(false);
      expect(result.claimedIds.size).toBe(0);
    });
  });

  describe("claimMissionReward", () => {
    it("calls invokeRewardAction and does not throw on success", async () => {
      vi.mocked(creditsApi.invokeRewardAction).mockResolvedValue({
        data: "ok",
        error: null,
      });

      await expect(
        claimMissionReward({ userId: "uid", missionId: "m1", title: "Test", credits: 10, xp: 5 }),
      ).resolves.toBeUndefined();

      expect(creditsApi.invokeRewardAction).toHaveBeenCalledWith({
        userId: "uid",
        actionType: "mission_m1",
        customCredits: 10,
        customExperience: 5,
        description: "Миссия: Test",
      });
    });

    it("throws on invoke error", async () => {
      vi.mocked(creditsApi.invokeRewardAction).mockResolvedValue({
        data: null,
        error: { message: "fail" },
      });

      await expect(
        claimMissionReward({ userId: "uid", missionId: "m1", title: "Test", credits: 10, xp: 5 }),
      ).rejects.toThrow("fail");
    });
  });

  describe("fetchStreakCalendarDays", () => {
    it("delegates to fetchCheckinsSince", async () => {
      const days = [{ checkin_date: "2026-07-01", credits_earned: 5, streak_day: 1 }];
      vi.mocked(creditsApi.fetchCheckinsSince).mockResolvedValue(days);

      const result = await fetchStreakCalendarDays("uid", "2026-06-01");

      expect(result).toEqual(days);
      expect(creditsApi.fetchCheckinsSince).toHaveBeenCalledWith("uid", "2026-06-01");
    });
  });

  describe("fetchQuickStats", () => {
    it("aggregates track and achievement counts", async () => {
      vi.mocked(creditsApi.countCompletedTracks).mockResolvedValue(15);
      vi.mocked(creditsApi.countUserAchievements).mockResolvedValue(3);

      const result = await fetchQuickStats("uid");

      expect(result.tracks).toBe(15);
      expect(result.achievements).toBe(3);
    });
  });

  describe("fetchSpecialChallengeStats", () => {
    it("aggregates all special challenge stats from APIs", async () => {
      vi.mocked(tracksApi.fetchTracks).mockResolvedValue({
        data: [{ id: "t1" }, { id: "t2" }],
        count: 2,
        error: null,
      });
      vi.mocked(creditsApi.countLikesForTracks).mockResolvedValue(10);
      vi.mocked(paymentsApi.getUserCredits).mockResolvedValue({
        data: { longest_streak: 7, level: 5 },
        error: null,
      });
      vi.mocked(creditsApi.countUserArtists).mockResolvedValue(3);
      vi.mocked(creditsApi.countUserAchievements).mockResolvedValue(4);

      const result = await fetchSpecialChallengeStats("uid");

      expect(result.totalTracks).toBe(2);
      expect(result.totalLikes).toBe(10);
      expect(result.longestStreak).toBe(7);
      expect(result.level).toBe(5);
      expect(result.artistsCount).toBe(3);
      expect(result.achievementsCount).toBe(4);
    });

    it("handles empty user credits gracefully", async () => {
      vi.mocked(tracksApi.fetchTracks).mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });
      vi.mocked(creditsApi.countLikesForTracks).mockResolvedValue(0);
      vi.mocked(paymentsApi.getUserCredits).mockResolvedValue({
        data: null,
        error: null,
      });
      vi.mocked(creditsApi.countUserArtists).mockResolvedValue(0);
      vi.mocked(creditsApi.countUserAchievements).mockResolvedValue(0);

      const result = await fetchSpecialChallengeStats("uid");

      expect(result.longestStreak).toBe(0);
      expect(result.level).toBe(1);
    });
  });

  describe("fetchWeeklyChallengeStats", () => {
    it("aggregates weekly stats", async () => {
      vi.mocked(creditsApi.countTracksCreatedBetween).mockResolvedValue(5);
      vi.mocked(creditsApi.countUserActivityBetween).mockResolvedValue(2);
      vi.mocked(paymentsApi.getUserCredits).mockResolvedValue({
        data: { current_streak: 3 },
        error: null,
      });
      vi.mocked(tracksApi.fetchTracks).mockResolvedValue({
        data: [{ id: "t1" }],
        count: 1,
        error: null,
      });
      vi.mocked(creditsApi.countLikesForTracksBetween).mockResolvedValue(7);

      const result = await fetchWeeklyChallengeStats("uid", "2026-07-01T00:00:00Z", "2026-07-07T23:59:59Z");

      expect(result.generations).toBe(5);
      expect(result.shares).toBe(2);
      expect(result.likesReceived).toBe(7);
      expect(result.currentStreak).toBe(3);
    });
  });
});
