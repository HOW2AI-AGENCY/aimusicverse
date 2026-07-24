/**
 * Unit tests for presets RPC wrappers (`apply_preset_to_track`,
 * `increment_preset_usage`) plus RLS visibility of preset rows for owner,
 * public and system scopes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  applyPresetToTrack,
  incrementPresetUsage,
  getPresets,
  getPresetById,
} from "@/api/presets.api";

const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function chainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "or", "order", "limit", "in"];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("presets.api RPC + RLS access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("applyPresetToTrack", () => {
    it("calls RPC with track_id + preset_id and increments usage", async () => {
      mockRpc
        .mockResolvedValueOnce({
          data: { mixer: { volume: 0.9, pan: 0 } },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await applyPresetToTrack("track-1", "preset-1");

      expect(result.success).toBe(true);
      expect(result.appliedSettings).toEqual({ mixer: { volume: 0.9, pan: 0 } });
      expect(mockRpc).toHaveBeenNthCalledWith(1, "apply_preset_to_track", {
        track_id: "track-1",
        preset_id: "preset-1",
      });
      expect(mockRpc).toHaveBeenNthCalledWith(2, "increment_preset_usage", {
        preset_id: "preset-1",
      });
    });

    it("fails cleanly when the caller does not own the track (RLS)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "permission denied for track" },
      });

      const result = await applyPresetToTrack("track-1", "preset-1");
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/permission denied/);
    });
  });

  describe("incrementPresetUsage", () => {
    it("calls RPC without throwing", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });
      await expect(incrementPresetUsage("preset-1")).resolves.toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith("increment_preset_usage", { preset_id: "preset-1" });
    });

    it("swallows errors — usage count is non-critical", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "function missing" } });
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      // Should not throw, even if the fallback path returns null.
      await expect(incrementPresetUsage("preset-1")).resolves.toBeUndefined();
    });
  });

  describe("RLS-driven visibility", () => {
    it("owner scope query filters by user_id and excludes system rows", async () => {
      const rows = [
        { id: "p1", name: "Mine", user_id: "owner", is_system: false, is_public: false },
      ];
      const chain = chainMock({ data: rows, error: null });
      mockFrom.mockReturnValue(chain);

      const { presets, error } = await getPresets({ scope: "user", userId: "owner" });
      expect(error).toBeNull();
      expect(presets).toHaveLength(1);
      expect(chain.eq).toHaveBeenCalledWith("user_id", "owner");
      expect(chain.eq).toHaveBeenCalledWith("is_system", false);
    });

    it("system scope surfaces global presets", async () => {
      const rows = [{ id: "sys-1", is_system: true, user_id: null, is_public: true }];
      const chain = chainMock({ data: rows, error: null });
      mockFrom.mockReturnValue(chain);

      const { presets } = await getPresets({ scope: "system" });
      expect(presets[0].id).toBe("sys-1");
      expect(chain.eq).toHaveBeenCalledWith("is_system", true);
    });

    it("public scope surfaces shared community presets", async () => {
      const rows = [{ id: "pub-1", is_public: true, is_system: false }];
      const chain = chainMock({ data: rows, error: null });
      mockFrom.mockReturnValue(chain);

      const { presets } = await getPresets({ scope: "public" });
      expect(presets[0].id).toBe("pub-1");
      expect(chain.eq).toHaveBeenCalledWith("is_public", true);
    });

    it("returns null when RLS blocks read of a specific preset", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const { data, error } = await getPresetById("blocked");
      expect(data).toBeNull();
      expect(error).toBeNull();
    });
  });
});
