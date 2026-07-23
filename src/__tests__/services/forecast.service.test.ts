/**
 * Unit tests for analytics/forecast.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as adminApi from "@/api/admin.api";

vi.mock("@/api/admin.api", () => ({
  fetchProfileSignupsForForecast: vi.fn(),
  fetchCompletedStarsRevenueForForecast: vi.fn(),
  fetchGenerationTaskCreatedForForecast: vi.fn(),
  fetchTracksCreatedForForecast: vi.fn(),
}));

import {
  forecastDaysFromTimePeriod,
  linearRegression,
  forecast,
  calcGrowth,
  aggregateByDay,
  getForecastData,
} from "@/services/analytics/forecast.service";

describe("analytics/forecast.service", () => {
  describe("forecastDaysFromTimePeriod", () => {
    it("24 hours → 7", () => expect(forecastDaysFromTimePeriod("24 hours")).toBe(7));
    it("7 days → 14", () => expect(forecastDaysFromTimePeriod("7 days")).toBe(14));
    it("30 days → 30", () => expect(forecastDaysFromTimePeriod("30 days")).toBe(30));
    it("default → 60", () => expect(forecastDaysFromTimePeriod("all time")).toBe(60));
  });

  describe("linearRegression", () => {
    it("returns slope and intercept for flat line", () => {
      const { slope, intercept } = linearRegression([5, 5, 5]);
      expect(slope).toBe(0);
      expect(intercept).toBe(5);
    });

    it("returns correct slope for increasing data", () => {
      const { slope, intercept } = linearRegression([1, 2, 3]);
      expect(slope).toBe(1);
      expect(intercept).toBe(1);
    });

    it("handles single element", () => {
      const { slope, intercept } = linearRegression([10]);
      expect(slope).toBe(0);
      expect(intercept).toBe(10);
    });

    it("handles empty input", () => {
      const { slope, intercept } = linearRegression([]);
      expect(slope).toBe(0);
      expect(intercept).toBe(0);
    });
  });

  describe("forecast", () => {
    it("predicts total over daysAhead", () => {
      // data: [10, 20, 30] → slope=10, intercept=10
      // predict index=2+30=32 → 10+10*32=330 → *30 → 9900
      const result = forecast([10, 20, 30], 30);
      expect(result).toBeGreaterThan(0);
    });

    it("handles empty data", () => {
      expect(forecast([], 10)).toBe(0);
    });
  });

  describe("calcGrowth", () => {
    it("positive trend returns positive %", () => {
      // first half [1,2] = 3, second [3,4] = 7 → (7-3)/3 = 133%
      const daily = [
        { date: "day1", value: 1 },
        { date: "day2", value: 2 },
        { date: "day3", value: 3 },
        { date: "day4", value: 4 },
      ];
      const growth = calcGrowth(daily);
      expect(growth).toBeCloseTo(133.33, 1);
    });

    it("returns 0 when first half is 0", () => {
      const daily = [
        { date: "d1", value: 0 },
        { date: "d2", value: 5 },
      ];
      expect(calcGrowth(daily)).toBe(0);
    });
  });

  describe("aggregateByDay", () => {
    const today = new Date("2026-07-09T12:00:00Z");

    it("counts 1 per row when no valueField", () => {
      const items = [
        { created_at: "2026-07-09T10:00:00Z" },
        { created_at: "2026-07-09T11:00:00Z" },
        { created_at: "2026-07-08T10:00:00Z" },
      ];

      const result = aggregateByDay(items, 3, today);
      expect(result).toHaveLength(3);
      // last entry = today (July 9)
      expect(result[result.length - 1].value).toBe(2);
    });

    it("sums valueField when provided", () => {
      const items = [
        { created_at: "2026-07-09T10:00:00Z", stars_amount: 100 },
        { created_at: "2026-07-08T10:00:00Z", stars_amount: 50 },
      ];

      const result = aggregateByDay(items, 2, today, "stars_amount");
      expect(result[result.length - 1].value).toBe(100);
      expect(result[result.length - 2].value).toBe(50);
    });

    it("handles null items", () => {
      const result = aggregateByDay(null, 5, today);
      expect(result).toHaveLength(5);
      expect(result.every((d) => d.value === 0)).toBe(true);
    });

    it("skips items without created_at", () => {
      const items = [{ created_at: null }];
      const result = aggregateByDay(items, 1, today);
      expect(result[0].value).toBe(0);
    });
  });

  describe("getForecastData", () => {
    it("fetches 4 series and builds ForecastData", async () => {
      // Freeze the clock so the fixture date (2026-07-09) stays inside the
      // 14-day aggregation window. Without this the test is date-brittle: once
      // the real "today" drifts >13 days past the fixture, the series gains an
      // extra out-of-window bucket and the length assertions fail.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));
      try {
        vi.mocked(adminApi.fetchProfileSignupsForForecast).mockResolvedValue([{ created_at: "2026-07-09T10:00:00Z" }]);
        vi.mocked(adminApi.fetchCompletedStarsRevenueForForecast).mockResolvedValue([
          { created_at: "2026-07-09T10:00:00Z", stars_amount: 500 },
        ]);
        vi.mocked(adminApi.fetchGenerationTaskCreatedForForecast).mockResolvedValue([]);
        vi.mocked(adminApi.fetchTracksCreatedForForecast).mockResolvedValue([]);

        const result = await getForecastData("7 days");

        expect(result.users).toHaveLength(14);
        expect(result.revenue.some((d) => d.value > 0)).toBe(true);
        expect(result.generations).toHaveLength(14);
        expect(result.tracks).toHaveLength(14);
        expect(result.predictions.usersNext30).toBeGreaterThanOrEqual(0);
        expect(typeof result.growth.users).toBe("number");
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
