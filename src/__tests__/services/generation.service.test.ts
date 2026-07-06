/**
 * Unit tests for generation.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  filterLogsByStatus,
  analyzeFailedLogs,
  calculateSuccessTrend,
  analyzeGenerationDurations,
  mergeRealtimeLogs,
  getGenerationActivity,
} from "@/services/generation.service";
import type { GenerationLog, GenerationStats } from "@/api/generation.api";

vi.mock("@/api/generation.api", () => ({
  fetchGenerationLogs: vi.fn(),
  fetchGenerationStats: vi.fn(),
}));

import { fetchGenerationLogs, fetchGenerationStats } from "@/api/generation.api";

const mockFetchLogs = fetchGenerationLogs as unknown as ReturnType<typeof vi.fn>;
const mockFetchStats = fetchGenerationStats as unknown as ReturnType<typeof vi.fn>;

function makeLog(overrides: Partial<GenerationLog> = {}): GenerationLog {
  return {
    id: `log-${Math.random().toString(36).slice(2, 8)}`,
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:01:00Z",
    error_message: null,
    ...overrides,
  } as GenerationLog;
}

beforeEach(() => vi.clearAllMocks());

describe("generation.service", () => {
  describe("filterLogsByStatus", () => {
    it("filters logs by completed status", () => {
      const logs = [
        makeLog({ id: "1", status: "completed" }),
        makeLog({ id: "2", status: "failed" }),
        makeLog({ id: "3", status: "completed" }),
      ];
      expect(filterLogsByStatus(logs, "completed")).toHaveLength(2);
    });

    it("filters logs by failed status", () => {
      const logs = [makeLog({ id: "1", status: "completed" }), makeLog({ id: "2", status: "failed" })];
      expect(filterLogsByStatus(logs, "failed")).toHaveLength(1);
    });

    it("returns empty for no matches", () => {
      const logs = [makeLog({ id: "1", status: "completed" })];
      expect(filterLogsByStatus(logs, "pending")).toHaveLength(0);
    });
  });

  describe("analyzeFailedLogs", () => {
    it("groups errors by message", () => {
      const logs = [
        makeLog({ id: "1", status: "failed", error_message: "Timeout" }),
        makeLog({ id: "2", status: "failed", error_message: "Timeout" }),
        makeLog({ id: "3", status: "failed", error_message: "Rate limit" }),
        makeLog({ id: "4", status: "completed" }),
      ];
      const result = analyzeFailedLogs(logs);
      expect(result.total).toBe(3);
      expect(result.byError["Timeout"]).toBe(2);
      expect(result.byError["Rate limit"]).toBe(1);
    });

    it("handles null error messages", () => {
      const logs = [makeLog({ id: "1", status: "failed", error_message: null })];
      const result = analyzeFailedLogs(logs);
      expect(result.byError["Unknown error"]).toBe(1);
    });

    it("returns zero for no failures", () => {
      const logs = [makeLog({ id: "1", status: "completed" })];
      const result = analyzeFailedLogs(logs);
      expect(result.total).toBe(0);
      expect(result.byError).toEqual({});
    });
  });

  describe("calculateSuccessTrend", () => {
    it("returns 'up' when rate increases", () => {
      const current = { success_rate: 95 } as GenerationStats;
      const previous = { success_rate: 85 } as GenerationStats;
      const result = calculateSuccessTrend(current, previous);
      expect(result.trend).toBe("up");
      expect(result.change).toBe(10);
    });

    it("returns 'down' when rate decreases", () => {
      const current = { success_rate: 80 } as GenerationStats;
      const previous = { success_rate: 90 } as GenerationStats;
      const result = calculateSuccessTrend(current, previous);
      expect(result.trend).toBe("down");
      expect(result.change).toBe(10);
    });

    it("returns 'stable' when change is less than 1%", () => {
      const current = { success_rate: 90.5 } as GenerationStats;
      const previous = { success_rate: 90.0 } as GenerationStats;
      const result = calculateSuccessTrend(current, previous);
      expect(result.trend).toBe("stable");
      expect(result.change).toBe(0);
    });
  });

  describe("analyzeGenerationDurations", () => {
    it("calculates avg, min, max, p95 durations", () => {
      const logs = Array.from({ length: 100 }, (_, i) =>
        makeLog({
          id: `log-${i}`,
          status: "completed",
          created_at: "2026-01-01T00:00:00Z",
          completed_at: new Date(Date.now() + (i + 1) * 1000).toISOString(),
        }),
      );
      const result = analyzeGenerationDurations(logs);
      expect(result.avgSeconds).toBeGreaterThan(0);
      expect(result.minSeconds).toBeGreaterThan(0);
      expect(result.maxSeconds).toBeGreaterThan(result.minSeconds);
      expect(result.p95Seconds).toBeGreaterThan(0);
    });

    it("returns zeros for empty logs", () => {
      const result = analyzeGenerationDurations([]);
      expect(result.avgSeconds).toBe(0);
      expect(result.minSeconds).toBe(0);
      expect(result.maxSeconds).toBe(0);
      expect(result.p95Seconds).toBe(0);
    });

    it("ignores logs without completed_at", () => {
      const logs = [makeLog({ status: "completed", completed_at: null })];
      const result = analyzeGenerationDurations(logs);
      expect(result.avgSeconds).toBe(0);
    });
  });

  describe("mergeRealtimeLogs", () => {
    it("adds new log at the beginning", () => {
      const existing = [makeLog({ id: "1" }), makeLog({ id: "2" })];
      const newLog = makeLog({ id: "3" });
      const result = mergeRealtimeLogs(existing, newLog);
      expect(result[0].id).toBe("3");
      expect(result).toHaveLength(3);
    });

    it("updates existing log in place", () => {
      const log1 = makeLog({ id: "1", status: "pending" });
      const log2 = makeLog({ id: "2" });
      const updated = { ...log1, status: "completed" };
      const result = mergeRealtimeLogs([log1, log2], updated);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("completed");
    });

    it("respects limit", () => {
      const existing = Array.from({ length: 5 }, (_, i) => makeLog({ id: `${i}` }));
      const newLog = makeLog({ id: "new" });
      const result = mergeRealtimeLogs(existing, newLog, 3);
      expect(result).toHaveLength(3);
    });
  });

  describe("getGenerationActivity", () => {
    it("fetches logs and stats in parallel", async () => {
      const logs = [makeLog()];
      const stats = {
        total_generations: 100,
        completed: 90,
        failed: 5,
        pending: 3,
        processing: 2,
        success_rate: 90,
        avg_duration_seconds: 60,
      };
      mockFetchLogs.mockResolvedValue(logs);
      mockFetchStats.mockResolvedValue(stats);

      const result = await getGenerationActivity("24h");
      expect(result.logs).toEqual(logs);
      expect(result.stats?.total).toBe(100);
      expect(result.stats?.completed).toBe(90);
      expect(result.stats?.pending).toBe(5); // pending + processing
      expect(result.hasActivity).toBe(true);
    });

    it("handles null stats", async () => {
      mockFetchLogs.mockResolvedValue([]);
      mockFetchStats.mockResolvedValue(null);

      const result = await getGenerationActivity();
      expect(result.stats).toBeNull();
      expect(result.hasActivity).toBe(false);
    });
  });
});
