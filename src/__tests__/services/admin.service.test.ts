/**
 * Unit tests for admin.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  TIME_RANGES,
  getIntervalFromTimeRange,
  aggregateGenerationStats,
  groupGenerationStatsByDay,
  generateMockPaymentCohortData,
  calculateChurnRisk,
  analyzeBotHealth,
} from "@/services/admin.service";
import type { UserGenerationStatRow, CompletedTransactionRow, BotMetrics, UserWithBalance } from "@/api/admin.api";

vi.mock("@/api/admin.api", () => ({}));
vi.mock("@/api/profiles.api", () => ({}));
vi.mock("@/api/payments.api", () => ({}));

describe("admin.service", () => {
  describe("TIME_RANGES", () => {
    it("has 4 ranges", () => {
      expect(TIME_RANGES).toHaveLength(4);
    });

    it("each range has label, value, interval", () => {
      for (const range of TIME_RANGES) {
        expect(range.label).toBeTruthy();
        expect(range.value).toBeTruthy();
        expect(range.interval).toBeTruthy();
      }
    });
  });

  describe("getIntervalFromTimeRange", () => {
    it("returns '1 hour' for '1h'", () => {
      expect(getIntervalFromTimeRange("1h")).toBe("1 hour");
    });

    it("returns '24 hours' for '24h'", () => {
      expect(getIntervalFromTimeRange("24h")).toBe("24 hours");
    });

    it("returns '7 days' for '7d'", () => {
      expect(getIntervalFromTimeRange("7d")).toBe("7 days");
    });

    it("returns '30 days' for '30d'", () => {
      expect(getIntervalFromTimeRange("30d")).toBe("30 days");
    });

    it("returns '24 hours' as default for unknown", () => {
      expect(getIntervalFromTimeRange("unknown")).toBe("24 hours");
    });
  });

  describe("aggregateGenerationStats", () => {
    it("aggregates rows correctly", () => {
      const rows: UserGenerationStatRow[] = [
        { user_id: "u1", date: "2026-07-01", generations_count: 10, successful_count: 8, failed_count: 2, music_count: 5, vocals_count: 3, instrumental_count: 2, extend_count: 0, stems_count: 0, cover_count: 0, estimated_cost: 100, credits_spent: 50 },
        { user_id: "u2", date: "2026-07-01", generations_count: 5, successful_count: 5, failed_count: 0, music_count: 3, vocals_count: 1, instrumental_count: 1, extend_count: 0, stems_count: 0, cover_count: 0, estimated_cost: 50, credits_spent: 25 },
      ];

      const result = aggregateGenerationStats(rows);

      expect(result.total_generations).toBe(15);
      expect(result.total_successful).toBe(13);
      expect(result.total_failed).toBe(2);
      expect(result.unique_users).toBe(2);
    });

    it("handles empty rows", () => {
      const result = aggregateGenerationStats([]);
      expect(result.total_generations).toBe(0);
      expect(result.unique_users).toBe(0);
    });
  });

  describe("groupGenerationStatsByDay", () => {
    it("groups rows by date", () => {
      const rows: UserGenerationStatRow[] = [
        { user_id: "u1", date: "2026-07-01", generations_count: 10, successful_count: 8, failed_count: 2, music_count: 5, vocals_count: 3, instrumental_count: 2, extend_count: 0, stems_count: 0, cover_count: 0, estimated_cost: 100, credits_spent: 50 },
        { user_id: "u2", date: "2026-07-01", generations_count: 5, successful_count: 5, failed_count: 0, music_count: 3, vocals_count: 1, instrumental_count: 1, extend_count: 0, stems_count: 0, cover_count: 0, estimated_cost: 50, credits_spent: 25 },
        { user_id: "u1", date: "2026-07-02", generations_count: 8, successful_count: 7, failed_count: 1, music_count: 4, vocals_count: 2, instrumental_count: 2, extend_count: 0, stems_count: 0, cover_count: 0, estimated_cost: 80, credits_spent: 40 },
      ];

      const result = groupGenerationStatsByDay(rows);

      expect(result).toHaveLength(2);
      // Order may vary, find by date
      const day1 = result.find((r) => r.date === "2026-07-01");
      const day2 = result.find((r) => r.date === "2026-07-02");
      expect(day1).toBeDefined();
      expect(day1!.generations_count).toBe(15);
      expect(day2).toBeDefined();
      expect(day2!.generations_count).toBe(8);
    });

    it("handles empty rows", () => {
      const result = groupGenerationStatsByDay([]);
      expect(result).toEqual([]);
    });
  });

  describe("generateMockPaymentCohortData", () => {
    it("generates correct number of months", () => {
      const result = generateMockPaymentCohortData(6);
      expect(result).toHaveLength(6);
    });

    it("each cohort has required fields", () => {
      const result = generateMockPaymentCohortData(3);
      for (const cohort of result) {
        expect(cohort.cohort_month).toBeTruthy();
        expect(cohort.total_users).toBeGreaterThan(0);
        expect(cohort.conversion_rate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("calculateChurnRisk", () => {
    it("returns high risk for low balance and no streak", () => {
      const user = { balance: 3, current_streak: 0 } as UserWithBalance;
      expect(calculateChurnRisk(user)).toBe("high");
    });

    it("returns medium risk for low balance with streak", () => {
      const user = { balance: 8, current_streak: 5 } as UserWithBalance;
      expect(calculateChurnRisk(user)).toBe("medium");
    });

    it("returns low risk for high balance", () => {
      const user = { balance: 100, current_streak: 10 } as UserWithBalance;
      expect(calculateChurnRisk(user)).toBe("low");
    });
  });

  describe("analyzeBotHealth", () => {
    it("returns healthy for good metrics", () => {
      const metrics: BotMetrics = {
        total_events: 1000,
        successful_events: 980,
        failed_events: 20,
        success_rate: 98,
        avg_response_time_ms: 200,
        events_by_type: {},
      };

      const result = analyzeBotHealth(metrics);

      expect(result.status).toBe("healthy");
      expect(result.issues).toEqual([]);
    });

    it("returns degraded for low success rate", () => {
      const metrics: BotMetrics = {
        total_events: 1000,
        successful_events: 900,
        failed_events: 100,
        success_rate: 90,
        avg_response_time_ms: 200,
        events_by_type: {},
      };

      const result = analyzeBotHealth(metrics);

      expect(result.status).not.toBe("healthy");
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("returns issues for high response time", () => {
      const metrics: BotMetrics = {
        total_events: 1000,
        successful_events: 980,
        failed_events: 20,
        success_rate: 98,
        avg_response_time_ms: 6000,
        events_by_type: {},
      };

      const result = analyzeBotHealth(metrics);

      expect(result.issues.some((i) => i.includes("response time"))).toBe(true);
    });
  });
});
