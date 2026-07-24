/**
 * Unit tests for RPC wrappers in batch.api.ts
 *
 * Covers `batch_stem_start`, `batch_stem_update_progress`, `batch_stem_cancel`,
 * `batch_stem_get` and their RLS access boundaries (owner allowed, non-owner
 * rejected). RLS itself is exercised by returning the shape Postgres would
 * emit — successful rows for the owner and errors for a foreign user.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  startStemBatch,
  updateStemBatchProgress,
  cancelStemBatch,
  getStemBatchViaRpc,
} from "@/api/batch.api";

const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

const OWNER_ROW = {
  id: "batch-1",
  status: "processing",
  progress: 25,
  results: { stems: [], summary: { total: 4, success: 1, processing: 3, failed: 0 } },
  metadata: { batch_type: "separate", stem_ids: ["s1", "s2"] },
  mode: "detailed",
  track_id: "track-1",
  user_id: "owner",
  created_at: "2026-07-24T00:00:00Z",
  updated_at: "2026-07-24T00:00:05Z",
};

describe("batch.api RPC wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startStemBatch", () => {
    it("invokes batch_stem_start with the correct payload and maps the row", async () => {
      mockRpc.mockResolvedValueOnce({ data: OWNER_ROW, error: null });

      const result = await startStemBatch({
        trackId: "track-1",
        mode: "detailed",
        metadata: { batch_type: "separate" },
      });

      expect(mockRpc).toHaveBeenCalledWith("batch_stem_start", {
        p_track_id: "track-1",
        p_mode: "detailed",
        p_metadata: { batch_type: "separate" },
      });
      expect(result.id).toBe("batch-1");
      expect(result.userId).toBe("owner");
      expect(result.results.summary.total).toBe(4);
    });

    it("throws when RLS denies the caller", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "new row violates row-level security policy" },
      });

      await expect(startStemBatch({ trackId: "track-1" })).rejects.toThrow(/row-level security/);
    });
  });

  describe("updateStemBatchProgress", () => {
    it("owner update succeeds", async () => {
      mockRpc.mockResolvedValueOnce({
        data: { ...OWNER_ROW, progress: 60, status: "processing" },
        error: null,
      });
      const result = await updateStemBatchProgress({
        batchId: "batch-1",
        progress: 60,
        status: "processing",
      });
      expect(mockRpc).toHaveBeenCalledWith(
        "batch_stem_update_progress",
        expect.objectContaining({ p_batch_id: "batch-1", p_progress: 60, p_status: "processing" }),
      );
      expect(result.progress).toBe(60);
    });

    it("non-owner receives a permission error", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });
      await expect(
        updateStemBatchProgress({ batchId: "batch-1", progress: 10 }),
      ).rejects.toThrow(/permission denied/);
    });
  });

  describe("cancelStemBatch", () => {
    it("cancels for the owner", async () => {
      mockRpc.mockResolvedValueOnce({
        data: { ...OWNER_ROW, status: "cancelled" },
        error: null,
      });
      const result = await cancelStemBatch("batch-1");
      expect(mockRpc).toHaveBeenCalledWith("batch_stem_cancel", { p_batch_id: "batch-1" });
      expect(result.status).toBe("cancelled");
    });

    it("propagates RLS denial for other users", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "no rows" } });
      await expect(cancelStemBatch("batch-1")).rejects.toThrow();
    });
  });

  describe("getStemBatchViaRpc", () => {
    it("reads the batch row for owner", async () => {
      mockRpc.mockResolvedValueOnce({ data: OWNER_ROW, error: null });
      const result = await getStemBatchViaRpc("batch-1");
      expect(result.trackId).toBe("track-1");
      expect(result.metadata).toEqual({ batch_type: "separate", stem_ids: ["s1", "s2"] });
    });

    it("propagates error for foreign user", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "not found" } });
      await expect(getStemBatchViaRpc("batch-1")).rejects.toThrow(/not found/);
    });
  });
});
