/**
 * Unit tests for analytics/funnel.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeFunnelDropoff } from "@/services/analytics/funnel.service";
import * as analyticsApi from "@/api/analytics.api";

vi.mock("@/api/analytics.api", () => ({
  fetchFunnelDropoffStats: vi.fn(),
}));

const mockFetchFunnel = analyticsApi.fetchFunnelDropoffStats as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe("funnel.service", () => {
  describe("analyzeFunnelDropoff", () => {
    it("returns null for empty steps", async () => {
      mockFetchFunnel.mockResolvedValue([]);
      expect(await analyzeFunnelDropoff("onboarding")).toBeNull();
    });

    it("returns null for null steps", async () => {
      mockFetchFunnel.mockResolvedValue(null);
      expect(await analyzeFunnelDropoff("onboarding")).toBeNull();
    });

    it("calculates overall conversion rate", async () => {
      const steps = [
        { step_name: "visit", users_reached: 1000, step_order: 1 },
        { step_name: "signup", users_reached: 500, step_order: 2 },
        { step_name: "first_gen", users_reached: 200, step_order: 3 },
      ];
      mockFetchFunnel.mockResolvedValue(steps);
      const result = await analyzeFunnelDropoff("onboarding");
      expect(result?.overallConversionRate).toBe(20); // 200/1000 * 100
    });

    it("finds biggest dropoff", async () => {
      const steps = [
        { step_name: "visit", users_reached: 1000, step_order: 1 },
        { step_name: "signup", users_reached: 100, step_order: 2 },
        { step_name: "first_gen", users_reached: 50, step_order: 3 },
      ];
      mockFetchFunnel.mockResolvedValue(steps);
      const result = await analyzeFunnelDropoff("onboarding");
      expect(result?.biggestDropoff?.step).toBe("visit");
      expect(result?.biggestDropoff?.rate).toBeCloseTo(90, 0);
    });

    it("handles zero users in first step", async () => {
      const steps = [
        { step_name: "visit", users_reached: 0, step_order: 1 },
        { step_name: "signup", users_reached: 0, step_order: 2 },
      ];
      mockFetchFunnel.mockResolvedValue(steps);
      const result = await analyzeFunnelDropoff("onboarding");
      expect(result?.overallConversionRate).toBe(0);
      expect(result?.biggestDropoff).toBeNull();
    });

    it("returns null biggestDropoff when no dropoffs", async () => {
      const steps = [{ step_name: "visit", users_reached: 100, step_order: 1 }];
      mockFetchFunnel.mockResolvedValue(steps);
      const result = await analyzeFunnelDropoff("onboarding");
      expect(result?.biggestDropoff).toBeNull();
    });
  });
});
