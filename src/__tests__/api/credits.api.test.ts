/**
 * Unit tests for credits.api.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchUserCredits,
  upsertUserCredits,
  addCredits,
  deductCredits,
  logCreditTransaction,
  fetchCreditTransactions,
  checkAdminStatus,
  fetchAchievements,
  fetchUserAchievements,
  fetchLeaderboard,
  fetchSunoApiBalance,
  hasCheckedInToday,
  recordCheckin,
  fetchTodayCheckin,
  countTracksCreatedBetween,
  countUserActivityBetween,
  countUserTrackLikesBetween,
  fetchClaimedMissionActions,
  invokeRewardAction,
  fetchCheckinsSince,
  countCompletedTracks,
  countUserAchievements,
  countLikesForTracks,
  countUserArtists,
  countLikesForTracksBetween,
} from "@/api/credits.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "in",
    "is",
    "or",
    "gte",
    "lte",
    "like",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("credits.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchUserCredits", () => {
    it("returns user credits when found", async () => {
      const mockData = { id: "1", user_id: "u1", balance: 100 };
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchUserCredits("u1");
      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith("user_credits");
    });

    it("returns null when no credits found", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchUserCredits("u1");
      expect(result).toBeNull();
    });

    it("throws on database error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "DB error" } }));

      await expect(fetchUserCredits("u1")).rejects.toThrow("DB error");
    });
  });

  describe("upsertUserCredits", () => {
    it("updates existing credits", async () => {
      const existing = { id: "1", user_id: "u1", balance: 50 };
      const updated = { id: "1", user_id: "u1", balance: 100 };

      // First call: fetch existing
      const fetchChain = createChainMock({ data: existing, error: null });
      // Second call: update
      const updateChain = createChainMock({ data: updated, error: null });

      mockFrom.mockReturnValueOnce(fetchChain).mockReturnValueOnce(updateChain);

      const result = await upsertUserCredits("u1", { balance: 100 });
      expect(result).toEqual(updated);
    });

    it("inserts new credits when none exist", async () => {
      const newCredits = { id: "1", user_id: "u1", balance: 50 };

      const fetchChain = createChainMock({ data: null, error: null });
      const insertChain = createChainMock({ data: newCredits, error: null });

      mockFrom.mockReturnValueOnce(fetchChain).mockReturnValueOnce(insertChain);

      const result = await upsertUserCredits("u1", { balance: 50 });
      expect(result).toEqual(newCredits);
    });
  });

  describe("addCredits", () => {
    it("adds amount to existing balance", async () => {
      const current = { id: "1", user_id: "u1", balance: 50, total_earned: 100, experience: 10 };
      const updated = { id: "1", user_id: "u1", balance: 70, total_earned: 120, experience: 20 };

      // addCredits → fetchUserCredits (1st) → upsertUserCredits → fetchUserCredits (2nd) → update
      const fetchChain1 = createChainMock({ data: current, error: null });
      const fetchChain2 = createChainMock({ data: current, error: null });
      const updateChain = createChainMock({ data: updated, error: null });
      mockFrom.mockReturnValueOnce(fetchChain1).mockReturnValueOnce(fetchChain2).mockReturnValueOnce(updateChain);

      const result = await addCredits("u1", 20, 10);
      expect(result.balance).toBe(70);
    });

    it("creates credits when none exist", async () => {
      const newCredits = { id: "1", user_id: "u1", balance: 20, total_earned: 20, experience: 0 };

      // addCredits → fetchUserCredits (1st, null) → upsertUserCredits → fetchUserCredits (2nd, null) → insert
      const fetchChain1 = createChainMock({ data: null, error: null });
      const fetchChain2 = createChainMock({ data: null, error: null });
      const insertChain = createChainMock({ data: newCredits, error: null });
      mockFrom.mockReturnValueOnce(fetchChain1).mockReturnValueOnce(fetchChain2).mockReturnValueOnce(insertChain);

      const result = await addCredits("u1", 20);
      expect(result.balance).toBe(20);
    });
  });

  describe("deductCredits", () => {
    it("deducts amount from balance", async () => {
      const current = { id: "1", user_id: "u1", balance: 100, total_spent: 50 };
      const updated = { id: "1", user_id: "u1", balance: 80, total_spent: 70 };

      // deductCredits → fetchUserCredits (1st) → upsertUserCredits → fetchUserCredits (2nd) → update
      const fetchChain1 = createChainMock({ data: current, error: null });
      const fetchChain2 = createChainMock({ data: current, error: null });
      const updateChain = createChainMock({ data: updated, error: null });
      mockFrom.mockReturnValueOnce(fetchChain1).mockReturnValueOnce(fetchChain2).mockReturnValueOnce(updateChain);

      const result = await deductCredits("u1", 20);
      expect(result.balance).toBe(80);
    });

    it("throws when insufficient balance", async () => {
      const current = { id: "1", user_id: "u1", balance: 5, total_spent: 0 };
      mockFrom.mockReturnValue(createChainMock({ data: current, error: null }));

      await expect(deductCredits("u1", 20)).rejects.toThrow("Insufficient balance");
    });

    it("throws when no credits record exists", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      await expect(deductCredits("u1", 20)).rejects.toThrow("Insufficient balance");
    });
  });

  describe("logCreditTransaction", () => {
    it("inserts transaction record", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await logCreditTransaction("u1", 10, "earn", "daily_checkin", "Daily bonus");
      expect(mockFrom).toHaveBeenCalledWith("credit_transactions");
      expect(chain.insert).toHaveBeenCalled();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "insert failed" } }));

      await expect(logCreditTransaction("u1", 10, "earn", "test")).rejects.toThrow("insert failed");
    });
  });

  describe("fetchCreditTransactions", () => {
    it("fetches transactions for user", async () => {
      const mockData = [{ id: "1", amount: 10 }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchCreditTransactions("u1");
      expect(result).toEqual(mockData);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "fetch failed" } }));

      await expect(fetchCreditTransactions("u1")).rejects.toThrow("fetch failed");
    });
  });

  describe("checkAdminStatus", () => {
    it("returns true when user is admin", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      const result = await checkAdminStatus("u1");
      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith("has_role", { _user_id: "u1", _role: "admin" });
    });

    it("returns false on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "rpc error" } });

      const result = await checkAdminStatus("u1");
      expect(result).toBe(false);
    });
  });

  describe("fetchAchievements", () => {
    it("fetches all achievements ordered", async () => {
      const mockData = [{ id: "1", category: "social" }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchAchievements();
      expect(result).toEqual(mockData);
    });
  });

  describe("fetchUserAchievements", () => {
    it("fetches user achievements with join", async () => {
      const mockData = [{ id: "1", achievement: { id: "a1" } }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchUserAchievements("u1");
      expect(result).toEqual(mockData);
    });
  });

  describe("fetchLeaderboard", () => {
    it("calls RPC with correct params", async () => {
      mockRpc.mockResolvedValue({ data: [{ user_id: "u1", score: 100 }], error: null });

      const result = await fetchLeaderboard(50, "overall");
      expect(mockRpc).toHaveBeenCalledWith("get_leaderboard", { _limit: 50, _category: "overall" });
      expect(result).toEqual([{ user_id: "u1", score: 100 }]);
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });

      await expect(fetchLeaderboard()).rejects.toThrow("rpc failed");
    });
  });

  describe("fetchSunoApiBalance", () => {
    it("returns credits from edge function", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { credits: 500 }, error: null });

      const result = await fetchSunoApiBalance();
      expect(result).toBe(500);
    });

    it("returns 0 when no credits field", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: {}, error: null });

      const result = await fetchSunoApiBalance();
      expect(result).toBe(0);
    });

    it("throws on error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "invoke failed" } });

      await expect(fetchSunoApiBalance()).rejects.toThrow("invoke failed");
    });
  });

  describe("hasCheckedInToday", () => {
    it("returns true when checkin exists", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: { id: "1" }, error: null }));

      const result = await hasCheckedInToday("u1");
      expect(result).toBe(true);
    });

    it("returns false when no checkin", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await hasCheckedInToday("u1");
      expect(result).toBe(false);
    });
  });

  describe("recordCheckin", () => {
    it("inserts checkin record", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await recordCheckin("u1", 5, 3);
      expect(mockFrom).toHaveBeenCalledWith("user_checkins");
      expect(chain.insert).toHaveBeenCalled();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "insert failed" } }));

      await expect(recordCheckin("u1", 5, 3)).rejects.toThrow("insert failed");
    });
  });

  describe("fetchTodayCheckin", () => {
    it("returns checkin when found", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: { id: "c1" }, error: null }));

      const result = await fetchTodayCheckin("u1", "2026-07-06");
      expect(result).toEqual({ id: "c1" });
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchTodayCheckin("u1", "2026-07-06");
      expect(result).toBeNull();
    });
  });

  describe("countTracksCreatedBetween", () => {
    it("returns count of tracks", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 5 }));

      const result = await countTracksCreatedBetween("u1", "2026-07-01", "2026-07-06");
      expect(result).toBe(5);
    });

    it("returns 0 when count is null", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: null }));

      const result = await countTracksCreatedBetween("u1", "2026-07-01", "2026-07-06");
      expect(result).toBe(0);
    });
  });

  describe("countUserActivityBetween", () => {
    it("returns activity count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 3 }));

      const result = await countUserActivityBetween("u1", "like", "2026-07-01", "2026-07-06");
      expect(result).toBe(3);
    });
  });

  describe("countUserTrackLikesBetween", () => {
    it("returns likes count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 10 }));

      const result = await countUserTrackLikesBetween("u1", "2026-07-01", "2026-07-06");
      expect(result).toBe(10);
    });
  });

  describe("fetchClaimedMissionActions", () => {
    it("returns claimed actions", async () => {
      const mockData = [{ action_type: "mission_daily" }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchClaimedMissionActions("u1", "2026-07-01", "2026-07-06");
      expect(result).toEqual(mockData);
    });

    it("returns empty array when null", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchClaimedMissionActions("u1", "2026-07-01", "2026-07-06");
      expect(result).toEqual([]);
    });
  });

  describe("invokeRewardAction", () => {
    it("invokes reward-action edge function", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });

      const result = await invokeRewardAction({
        userId: "u1",
        actionType: "mission_daily",
        customCredits: 5,
        customExperience: 10,
        description: "Daily mission",
      });
      expect(mockFunctions.invoke).toHaveBeenCalledWith("reward-action", expect.any(Object));
      expect(result.data).toEqual({ success: true });
    });
  });

  describe("fetchCheckinsSince", () => {
    it("returns checkin calendar data", async () => {
      const mockData = [{ checkin_date: "2026-07-06", credits_earned: 5, streak_day: 1 }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchCheckinsSince("u1", "2026-07-01");
      expect(result).toEqual(mockData);
    });
  });

  describe("countCompletedTracks", () => {
    it("returns completed track count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 15 }));

      const result = await countCompletedTracks("u1");
      expect(result).toBe(15);
    });
  });

  describe("countUserAchievements", () => {
    it("returns achievement count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 8 }));

      const result = await countUserAchievements("u1");
      expect(result).toBe(8);
    });
  });

  describe("countLikesForTracks", () => {
    it("returns likes count for tracks", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 25 }));

      const result = await countLikesForTracks(["t1", "t2"]);
      expect(result).toBe(25);
    });

    it("returns 0 for empty track list", async () => {
      const result = await countLikesForTracks([]);
      expect(result).toBe(0);
    });
  });

  describe("countUserArtists", () => {
    it("returns artist count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 3 }));

      const result = await countUserArtists("u1");
      expect(result).toBe(3);
    });
  });

  describe("countLikesForTracksBetween", () => {
    it("returns likes count in date range", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 12 }));

      const result = await countLikesForTracksBetween(["t1", "t2"], "2026-07-01", "2026-07-06");
      expect(result).toBe(12);
    });

    it("returns 0 for empty track list", async () => {
      const result = await countLikesForTracksBetween([], "2026-07-01", "2026-07-06");
      expect(result).toBe(0);
    });
  });
});
