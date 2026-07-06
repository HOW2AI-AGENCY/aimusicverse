/**
 * Unit tests for profiles.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPublicProfile,
  fetchProfileByUserId,
  fetchUserSubscriptionTier,
  updateUserProfile,
  fetchProfileCount,
  fetchProfileCountInRange,
} from "@/api/profiles.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "update", "eq", "gte", "lt", "single", "maybeSingle"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  chain.maybeSingle.mockReturnValue(Promise.resolve(result));
  // For count queries
  const thenable = { ...chain };
  thenable.then = (resolve: (v: unknown) => void) => resolve(result);
  for (const m of Object.keys(chain)) {
    if (m !== "then") chain[m].mockReturnValue(thenable);
  }
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("profiles.api", () => {
  describe("fetchPublicProfile", () => {
    it("fetches profile by user_id", async () => {
      const profile = { user_id: "u1", display_name: "Test" };
      mockFrom.mockReturnValue(chainMock({ data: profile, error: null }));
      const res = await fetchPublicProfile("u1");
      expect(res).toEqual(profile);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchPublicProfile("nonexistent");
      expect(res).toBeNull();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "db error" } }));
      await expect(fetchPublicProfile("u1")).rejects.toThrow("db error");
    });
  });

  describe("fetchProfileByUserId", () => {
    it("fetches profile", async () => {
      const profile = { user_id: "u1", is_public: true };
      mockFrom.mockReturnValue(chainMock({ data: profile, error: null }));
      const res = await fetchProfileByUserId("u1");
      expect(res).toEqual(profile);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      await expect(fetchProfileByUserId("u1")).rejects.toThrow("fail");
    });
  });

  describe("fetchUserSubscriptionTier", () => {
    it("returns tier when present", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { subscription_tier: "premium" }, error: null }));
      expect(await fetchUserSubscriptionTier("u1")).toBe("premium");
    });

    it("returns null when no tier", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { subscription_tier: null }, error: null }));
      expect(await fetchUserSubscriptionTier("u1")).toBeNull();
    });

    it("returns null when no data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchUserSubscriptionTier("u1")).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("updates and returns profile", async () => {
      const updated = { user_id: "u1", display_name: "New Name" };
      mockFrom.mockReturnValue(chainMock({ data: updated, error: null }));
      const res = await updateUserProfile("u1", { display_name: "New Name" });
      expect(res).toEqual(updated);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "update failed" } }));
      await expect(updateUserProfile("u1", { display_name: "X" })).rejects.toThrow("update failed");
    });
  });

  describe("fetchProfileCount", () => {
    it("returns count without filters", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: 42 }));
      expect(await fetchProfileCount()).toBe(42);
    });

    it("returns 0 when count is null", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: null }));
      expect(await fetchProfileCount()).toBe(0);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "count failed" } }));
      await expect(fetchProfileCount()).rejects.toThrow("count failed");
    });
  });

  describe("fetchProfileCountInRange", () => {
    it("returns count in date range", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: 10 }));
      const res = await fetchProfileCountInRange({ startDate: new Date("2026-01-01") });
      expect(res).toBe(10);
    });

    it("applies end date filter", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: 5 }));
      const res = await fetchProfileCountInRange({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-01"),
      });
      expect(res).toBe(5);
    });
  });
});
