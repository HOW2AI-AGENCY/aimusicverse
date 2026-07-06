/**
 * Unit tests for generation.api.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchGenerationLogs,
  fetchGenerationStats,
  retryGenerationTask,
  logGenerationFailure,
  deleteGenerationTask,
  dismissGenerationTask,
  cancelGenerationTask,
  getTimeFilter,
  getInterval,
} from "@/api/generation.api";

// Access the mocked supabase
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
    "neq",
    "in",
    "is",
    "or",
    "gte",
    "lte",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Terminal methods
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  // Make the chain thenable
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("generation.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchGenerationLogs", () => {
    it("fetches logs with default filters", async () => {
      const mockData = [{ id: "1", status: "completed" }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchGenerationLogs();
      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith("generation_tasks");
    });

    it("applies status filter when provided", async () => {
      const chain = createChainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await fetchGenerationLogs({ status: "failed" });
      expect(chain.eq).toHaveBeenCalledWith("status", "failed");
    });

    it("applies userId filter when provided", async () => {
      const chain = createChainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await fetchGenerationLogs({ userId: "user-123" });
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("throws on database error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "DB error" } }));

      await expect(fetchGenerationLogs()).rejects.toThrow("DB error");
    });
  });

  describe("fetchGenerationStats", () => {
    it("calls RPC with correct interval", async () => {
      mockRpc.mockResolvedValue({
        data: [{ total_generations: 100, success_rate: 88 }],
        error: null,
      });

      const result = await fetchGenerationStats("24h");
      expect(mockRpc).toHaveBeenCalledWith("get_generation_stats", { _time_period: "24 hours" });
      expect(result).toEqual({ total_generations: 100, success_rate: 88 });
    });

    it("throws on RPC error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

      await expect(fetchGenerationStats()).rejects.toThrow("RPC failed");
    });
  });

  describe("retryGenerationTask", () => {
    it("updates task status to pending", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await retryGenerationTask("task-123");
      expect(mockFrom).toHaveBeenCalledWith("generation_tasks");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "task-123");
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "update failed" } }));

      await expect(retryGenerationTask("task-123")).rejects.toThrow("update failed");
    });
  });

  describe("logGenerationFailure", () => {
    it("updates task with failure details", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await logGenerationFailure("task-123", {
        failure_category: "api_error",
        abort_reason: "timeout",
        retry_count: 2,
      });
      expect(mockFrom).toHaveBeenCalledWith("generation_tasks");
      expect(chain.update).toHaveBeenCalled();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "log failed" } }));

      await expect(logGenerationFailure("task-123", { failure_category: "unknown" })).rejects.toThrow("log failed");
    });
  });

  describe("deleteGenerationTask", () => {
    it("deletes task by id", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await deleteGenerationTask("task-123");
      expect(mockFrom).toHaveBeenCalledWith("generation_tasks");
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "task-123");
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "delete failed" } }));

      await expect(deleteGenerationTask("task-123")).rejects.toThrow("delete failed");
    });
  });

  describe("dismissGenerationTask", () => {
    it("updates task status to dismissed", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await dismissGenerationTask("task-123");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "task-123");
    });
  });

  describe("cancelGenerationTask", () => {
    it("updates task status to cancelled with reason", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await cancelGenerationTask("task-123", "user_cancelled");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "task-123");
    });

    it("uses default reason when not provided", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await cancelGenerationTask("task-123");
      expect(chain.update).toHaveBeenCalled();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "cancel failed" } }));

      await expect(cancelGenerationTask("task-123")).rejects.toThrow("cancel failed");
    });
  });
});
