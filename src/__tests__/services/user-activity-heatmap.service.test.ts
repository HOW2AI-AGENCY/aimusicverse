/**
 * Unit tests for analytics/user-activity-heatmap.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as adminApi from "@/api/admin.api";

vi.mock("@/api/admin.api", () => ({
  fetchAnalyticsEventsForHeatmap: vi.fn(),
}));

import {
  timePeriodToStartDate,
  buildHeatmapData,
  getUserActivityHeatmap,
} from "@/services/analytics/user-activity-heatmap.service";

describe("analytics/user-activity-heatmap.service", () => {
  describe("timePeriodToStartDate", () => {
    it("maps 24 hours to ~1 day ago", () => {
      const d = timePeriodToStartDate("24 hours");
      expect(Date.now() - d.getTime()).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    });

    it("maps 30 days to ~30 days ago", () => {
      const d = timePeriodToStartDate("30 days");
      expect(Date.now() - d.getTime()).toBeLessThan(31 * 24 * 60 * 60 * 1000);
    });

    it("defaults unknown to 90 days", () => {
      const d = timePeriodToStartDate("forever");
      expect(Date.now() - d.getTime()).toBeLessThan(91 * 24 * 60 * 60 * 1000);
    });
  });

  describe("buildHeatmapData", () => {
    it("returns 7x24 matrix of zeros for no events", () => {
      const result = buildHeatmapData([]);

      expect(result.hourlyActivity).toHaveLength(7);
      expect(result.hourlyActivity[0]).toHaveLength(24);
      expect(result.totalEvents).toBe(0);
      expect(result.avgEventsPerHour).toBe(0);
      expect(result.hourlyActivity.every((row) => row.every((c) => c === 0))).toBe(true);
    });

    it("counts events in correct day/hour slots", () => {
      // Use relative timestamps so timezone doesn't matter
      const now = Date.now();
      const hour10 = new Date(now);
      hour10.setHours(10, 0, 0, 0);
      const hour11 = new Date(now);
      hour11.setHours(11, 0, 0, 0);

      const events = [
        { created_at: hour10.toISOString() },
        { created_at: new Date(hour10.getTime() + 30 * 60 * 1000).toISOString() },
        { created_at: hour11.toISOString() },
      ];

      const result = buildHeatmapData(events);

      const expectedDay = (new Date().getDay() + 6) % 7;
      expect(result.hourlyActivity[expectedDay][10]).toBe(2);
      expect(result.hourlyActivity[expectedDay][11]).toBe(1);
      expect(result.totalEvents).toBe(3);
      expect(result.peakDay).toBe(expectedDay);
      expect(result.peakHour).toBe(10);
    });

    it("handles events with null created_at", () => {
      const events = [{ created_at: null }];

      const result = buildHeatmapData(events);

      expect(result.totalEvents).toBe(1);
      expect(typeof result.peakDay).toBe("number");
    });

    it("computes avgEventsPerHour", () => {
      const events = Array.from({ length: 168 }, (_, i) => ({
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
      }));

      const result = buildHeatmapData(events);

      expect(result.totalEvents).toBe(168);
      expect(result.avgEventsPerHour).toBeCloseTo(1, 0);
    });
  });

  describe("getUserActivityHeatmap", () => {
    it("fetches events and builds heatmap", async () => {
      vi.mocked(adminApi.fetchAnalyticsEventsForHeatmap).mockResolvedValue([
        { created_at: "2026-07-09T10:00:00Z" },
        { created_at: "2026-07-09T10:00:00Z" },
      ] as never);

      const result = await getUserActivityHeatmap("7 days");

      expect(adminApi.fetchAnalyticsEventsForHeatmap).toHaveBeenCalledWith({
        startDate: expect.any(Date),
      });
      expect(result.totalEvents).toBe(2);
    });
  });
});
