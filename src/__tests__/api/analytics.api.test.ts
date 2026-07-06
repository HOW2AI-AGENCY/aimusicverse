/**
 * Unit tests for analytics.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  trackAnalyticsEvent,
  fetchUserBehaviorStats,
  trackDeeplinkVisit,
  markDeeplinkConversion,
  fetchDeeplinkStats,
  fetchDeeplinkEvents,
  fetchFunnelDropoffStats,
} from "@/api/analytics.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

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

describe("analytics.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackAnalyticsEvent", () => {
    it("inserts event into user_analytics_events", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(
        trackAnalyticsEvent({
          eventType: "page_view",
          sessionId: "sess-1",
          pagePath: "/home",
        }),
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("user_analytics_events");
    });

    it("throws on insert error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Insert fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(trackAnalyticsEvent({ eventType: "page_view", sessionId: "sess-1" })).rejects.toThrow("Insert fail");
    });
  });

  describe("fetchUserBehaviorStats", () => {
    it("returns stats from RPC", async () => {
      const stats = {
        total_events: 1000,
        unique_sessions: 200,
        unique_users: 150,
        events_by_type: { page_view: 500 },
        top_pages: [{ page_path: "/home", views: 300 }],
        hourly_distribution: { "10": 50 },
      };
      mockRpc.mockResolvedValue({ data: [stats], error: null });

      const result = await fetchUserBehaviorStats("7 days");

      expect(result?.total_events).toBe(1000);
      expect(result?.unique_sessions).toBe(200);
    });

    it("returns falsy when no data", async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await fetchUserBehaviorStats();
      expect(result).toBeFalsy();
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "RPC fail" } });

      await expect(fetchUserBehaviorStats()).rejects.toThrow("RPC fail");
    });
  });

  describe("trackDeeplinkVisit", () => {
    it("inserts deeplink visit", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(
        trackDeeplinkVisit({
          sessionId: "sess-1",
          deeplinkType: "generate",
          deeplinkValue: "test",
          source: "telegram",
        }),
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("deeplink_analytics");
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(trackDeeplinkVisit({ sessionId: "s1", deeplinkType: "generate" })).rejects.toThrow("fail");
    });
  });

  describe("markDeeplinkConversion", () => {
    it("updates conversion status", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(markDeeplinkConversion("sess-1", "signup")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(markDeeplinkConversion("sess-1", "signup")).rejects.toThrow("fail");
    });
  });

  describe("fetchDeeplinkStats", () => {
    it("returns stats from RPC", async () => {
      const stats = {
        total_clicks: 100,
        unique_users: 50,
        conversions: 20,
        conversion_rate: 20,
        top_sources: [{ source: "telegram", count: 80 }],
        top_types: [{ deeplink_type: "generate", count: 60 }],
      };
      mockRpc.mockResolvedValue({ data: [stats], error: null });

      const result = await fetchDeeplinkStats("7 days");

      expect(result?.total_clicks).toBe(100);
      expect(result?.conversion_rate).toBe(20);
    });

    it("returns falsy when no data", async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await fetchDeeplinkStats();
      expect(result).toBeFalsy();
    });
  });

  describe("fetchDeeplinkEvents", () => {
    it("fetches events with options", async () => {
      const chain = createChainMock({
        data: [{ id: "d1", deeplink_type: "generate" }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await fetchDeeplinkEvents({ timeRange: "7 days", limit: 10 });

      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(fetchDeeplinkEvents({})).rejects.toThrow("fail");
    });
  });

  describe("fetchFunnelDropoffStats", () => {
    it("returns funnel data from RPC", async () => {
      const data = [
        {
          step_name: "view",
          step_index: 0,
          users_reached: 100,
          users_dropped: 20,
          conversion_rate: 80,
          avg_duration_ms: 500,
        },
        {
          step_name: "click",
          step_index: 1,
          users_reached: 80,
          users_dropped: 30,
          conversion_rate: 62.5,
          avg_duration_ms: 1000,
        },
      ];
      mockRpc.mockResolvedValue({ data, error: null });

      const result = await fetchFunnelDropoffStats("signup");

      expect(result).toHaveLength(2);
      expect(result[0].step_name).toBe("view");
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });

      await expect(fetchFunnelDropoffStats("signup")).rejects.toThrow("fail");
    });
  });
});
