/**
 * Unit tests for admin.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  checkAdminRole,
  fetchUserBalanceSummary,
  fetchUsersWithBalances,
  fetchBotMetrics,
  fetchRecentBotEvents,
  fetchUserFeedback,
  closeFeedbackItem,
  reportContent,
  fetchTodayGenerationStats,
  fetchUserGenerationStats,
  fetchProfilesSummary,
  fetchCompletedStarsTransactions,
  fetchAllUserCreditsList,
  fetchBotMenuImagesConfig,
  fetchCompletedTracksForContentAnalytics,
} from "@/api/admin.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const mockAuthGetUser = supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "gte",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "upsert",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("admin.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAdminRole", () => {
    it("returns true when user has admin role", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      const result = await checkAdminRole("user-1");

      expect(mockRpc).toHaveBeenCalledWith("has_role", { _user_id: "user-1", _role: "admin" });
      expect(result).toBe(true);
    });

    it("returns false when user is not admin", async () => {
      mockRpc.mockResolvedValue({ data: false, error: null });

      const result = await checkAdminRole("user-1");
      expect(result).toBe(false);
    });

    it("throws on RPC error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "RPC fail" } });

      await expect(checkAdminRole("user-1")).rejects.toThrow("RPC fail");
    });
  });

  describe("fetchUserBalanceSummary", () => {
    it("returns summary from RPC", async () => {
      const summary = {
        total_users: 100,
        total_balance: 5000,
        total_earned: 10000,
        total_spent: 5000,
        avg_balance: 50,
        users_with_zero_balance: 10,
        users_low_balance: 20,
      };
      mockRpc.mockResolvedValue({ data: [summary], error: null });

      const result = await fetchUserBalanceSummary();

      expect(result?.total_users).toBe(100);
      expect(result?.total_balance).toBe(5000);
    });

    it("returns null when no data", async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await fetchUserBalanceSummary();
      expect(result).toBeNull();
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });

      await expect(fetchUserBalanceSummary()).rejects.toThrow("fail");
    });
  });

  describe("fetchUsersWithBalances", () => {
    it("merges profiles and credits data", async () => {
      const profilesChain = createChainMock({
        data: [
          {
            user_id: "u1",
            username: "alice",
            first_name: "Alice",
            last_name: null,
            photo_url: null,
            subscription_tier: null,
            subscription_expires_at: null,
            created_at: "2026-01-01",
          },
        ],
        error: null,
      });
      const creditsChain = createChainMock({
        data: [
          {
            user_id: "u1",
            balance: 100,
            total_earned: 200,
            total_spent: 100,
            level: 5,
            experience: 500,
            current_streak: 3,
          },
        ],
        error: null,
      });

      mockFrom.mockReturnValueOnce(profilesChain).mockReturnValueOnce(creditsChain);

      const result = await fetchUsersWithBalances({ limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe(100);
      expect(result[0].level).toBe(5);
    });

    it("throws on profiles error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(fetchUsersWithBalances({})).rejects.toThrow("fail");
    });
  });

  describe("fetchBotMetrics", () => {
    it("returns metrics from RPC", async () => {
      const metrics = {
        total_events: 100,
        successful_events: 90,
        failed_events: 10,
        success_rate: 90,
        avg_response_time_ms: 150,
        events_by_type: {},
      };
      mockRpc.mockResolvedValue({ data: [metrics], error: null });

      const result = await fetchBotMetrics("24 hours");

      expect(result?.success_rate).toBe(90);
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });

      await expect(fetchBotMetrics()).rejects.toThrow("fail");
    });
  });

  describe("fetchRecentBotEvents", () => {
    it("fetches events with limit", async () => {
      const chain = createChainMock({ data: [{ id: "e1" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchRecentBotEvents(10);

      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(fetchRecentBotEvents()).rejects.toThrow("fail");
    });
  });

  describe("fetchUserFeedback", () => {
    it("fetches feedback without status filter", async () => {
      const chain = createChainMock({ data: [{ id: "f1" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchUserFeedback();
      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(fetchUserFeedback()).rejects.toThrow("fail");
    });
  });

  describe("closeFeedbackItem", () => {
    it("updates feedback status to closed", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(closeFeedbackItem("f1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(closeFeedbackItem("f1")).rejects.toThrow("fail");
    });
  });

  describe("reportContent", () => {
    it("creates a moderation report", async () => {
      const chain = createChainMock({ data: { id: "r1" }, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await reportContent({
        reporterId: "u1",
        reportedUserId: "u2",
        entityType: "track",
        entityId: "t1",
        reason: "spam",
      });

      expect(result.id).toBe("r1");
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(
        reportContent({ reporterId: "u1", reportedUserId: "u2", entityType: "track", entityId: "t1", reason: "spam" }),
      ).rejects.toThrow("fail");
    });
  });

  describe("fetchTodayGenerationStats", () => {
    it("computes stats from generation tasks", async () => {
      const chain = createChainMock({
        data: [{ status: "completed" }, { status: "completed" }, { status: "failed" }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTodayGenerationStats(new Date("2026-07-06"));

      expect(result.total).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.successRate).toBeCloseTo(66.67, 0);
    });

    it("returns 100% success rate when no tasks", async () => {
      const chain = createChainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTodayGenerationStats(new Date("2026-07-06"));

      expect(result.total).toBe(0);
      expect(result.successRate).toBe(100);
    });
  });

  describe("fetchUserGenerationStats", () => {
    it("fetches stats with date filter", async () => {
      const chain = createChainMock({ data: [{ user_id: "u1", date: "2026-07-06" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchUserGenerationStats({ startDate: new Date("2026-07-01") });

      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(fetchUserGenerationStats({ startDate: new Date() })).rejects.toThrow("fail");
    });
  });

  describe("fetchProfilesSummary", () => {
    it("returns empty array for empty input", async () => {
      const result = await fetchProfilesSummary([]);
      expect(result).toEqual([]);
    });

    it("fetches profiles by user ids", async () => {
      const chain = createChainMock({ data: [{ user_id: "u1", first_name: "Alice" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchProfilesSummary(["u1"]);
      expect(result).toHaveLength(1);
    });
  });

  describe("fetchCompletedStarsTransactions", () => {
    it("fetches completed transactions", async () => {
      const chain = createChainMock({ data: [{ user_id: "u1", stars_amount: 100 }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchCompletedStarsTransactions({ startDate: new Date("2026-07-01") });

      expect(result).toHaveLength(1);
    });
  });

  describe("fetchAllUserCreditsList", () => {
    it("fetches all user credits", async () => {
      const chain = createChainMock({ data: [{ user_id: "u1", balance: 100, total_earned: 200 }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchAllUserCreditsList();

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe(100);
    });
  });

  describe("fetchBotMenuImagesConfig", () => {
    it("returns config when found", async () => {
      const chain = createChainMock({ data: { config_value: { home: "img.png" } }, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchBotMenuImagesConfig();

      expect(result).toEqual({ home: "img.png" });
    });

    it("returns empty object when not found", async () => {
      const chain = createChainMock({ data: null, error: { code: "PGRST116", message: "not found" } });
      mockFrom.mockReturnValue(chain);

      const result = await fetchBotMenuImagesConfig();

      expect(result).toEqual({});
    });
  });

  describe("fetchCompletedTracksForContentAnalytics", () => {
    it("fetches completed tracks", async () => {
      const chain = createChainMock({ data: [{ computed_genre: "rock", status: "completed" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await fetchCompletedTracksForContentAnalytics({ startDate: new Date("2026-07-01") });

      expect(result).toHaveLength(1);
      expect(result[0].computed_genre).toBe("rock");
    });
  });
});
