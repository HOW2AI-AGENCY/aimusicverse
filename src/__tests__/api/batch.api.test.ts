/**
 * Unit tests for batch.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getBatchStatus, getTrackBatches, cancelBatch, deleteBatch, getActiveUserBatches } from "@/api/batch.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "in", "order", "limit", "single", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("batch.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBatchStatus", () => {
    it("fetches batch status by id", async () => {
      const chain = createChainMock({
        data: {
          id: "b1",
          status: "completed",
          progress: 100,
          total_items: 5,
          completed_items: 5,
          failed_items: 0,
          track_id: "t1",
          user_id: "u1",
          operation_type: "transcribe",
          created_at: "2026-07-06",
          updated_at: "2026-07-06",
        },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getBatchStatus("b1");

      expect(result.id).toBe("b1");
      expect(result.status).toBe("completed");
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(getBatchStatus("b1")).rejects.toThrow();
    });
  });

  describe("getTrackBatches", () => {
    it("fetches batches for a track", async () => {
      const chain = createChainMock({
        data: [
          {
            id: "b1",
            status: "completed",
            progress: 100,
            total_items: 5,
            completed_items: 5,
            failed_items: 0,
            track_id: "t1",
            user_id: "u1",
            operation_type: "transcribe",
            created_at: "2026-07-06",
            updated_at: "2026-07-06",
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getTrackBatches("t1");

      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(getTrackBatches("t1")).rejects.toThrow();
    });
  });

  describe("cancelBatch", () => {
    it("cancels a batch", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(cancelBatch("b1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(cancelBatch("b1")).rejects.toThrow();
    });
  });

  describe("deleteBatch", () => {
    it("deletes a batch", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(deleteBatch("b1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(deleteBatch("b1")).rejects.toThrow();
    });
  });

  describe("getActiveUserBatches", () => {
    it("fetches active batches for user", async () => {
      const chain = createChainMock({
        data: [
          {
            id: "b1",
            status: "processing",
            progress: 50,
            total_items: 10,
            completed_items: 5,
            failed_items: 0,
            track_id: "t1",
            user_id: "u1",
            operation_type: "separate",
            created_at: "2026-07-06",
            updated_at: "2026-07-06",
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getActiveUserBatches("u1");

      expect(result).toHaveLength(1);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(getActiveUserBatches("u1")).rejects.toThrow();
    });
  });
});
