/**
 * Unit tests for tracks.api.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTracks,
  fetchTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  countUserTracks,
  fetchTrackLikesWithUser,
  toggleTrackLike,
  incrementPlayCount,
  fetchTrackVersions,
  fetchTrackVersionsDetailed,
  fetchParentTrack,
} from "@/api/tracks.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown; count?: number | null }) {
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
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("tracks.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchTracks", () => {
    it("fetches tracks with default filters", async () => {
      const mockData = [{ id: "1", title: "Test Track" }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null, count: 1 }));

      const result = await fetchTracks({});
      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(1);
      expect(result.error).toBeNull();
    });

    it("applies userId filter", async () => {
      const chain = createChainMock({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchTracks({ userId: "u1" });
      expect(chain.eq).toHaveBeenCalledWith("user_id", "u1");
    });

    it("applies search query", async () => {
      const chain = createChainMock({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchTracks({ searchQuery: "rock" });
      expect(chain.or).toHaveBeenCalled();
    });

    it("applies popular sort", async () => {
      const chain = createChainMock({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchTracks({ sortBy: "popular" });
      expect(chain.order).toHaveBeenCalledWith("play_count", { ascending: false, nullsFirst: false });
    });

    it("applies liked sort", async () => {
      const chain = createChainMock({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchTracks({ sortBy: "liked" });
      expect(chain.order).toHaveBeenCalledWith("likes_count", { ascending: false, nullsFirst: false });
    });

    it("applies pagination", async () => {
      const chain = createChainMock({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchTracks({}, { page: 0, pageSize: 10 });
      expect(chain.range).toHaveBeenCalledWith(0, 9);
    });

    it("returns error when query fails", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "query failed" }, count: null }));

      const result = await fetchTracks({});
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe("query failed");
    });
  });

  describe("fetchTrackById", () => {
    it("returns track when found", async () => {
      const mockTrack = { id: "t1", title: "My Track", audio_url: "url1" };
      mockFrom.mockReturnValue(createChainMock({ data: mockTrack, error: null }));

      const result = await fetchTrackById("t1");
      expect(result).toEqual(mockTrack);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchTrackById("nonexistent");
      expect(result).toBeNull();
    });

    it("resolves audio_url from active_version", async () => {
      const mockTrack = {
        id: "t1",
        title: "My Track",
        audio_url: "old_url",
        active_version: { audio_url: "new_url", cover_url: "new_cover" },
      };
      mockFrom.mockReturnValue(createChainMock({ data: mockTrack, error: null }));

      const result = await fetchTrackById("t1");
      expect(result!.audio_url).toBe("new_url");
      expect(result!.cover_url).toBe("new_cover");
    });

    it("throws on database error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "DB error" } }));

      await expect(fetchTrackById("t1")).rejects.toThrow("DB error");
    });
  });

  describe("createTrack", () => {
    it("creates a new track", async () => {
      const newTrack = { id: "t1", title: "New Track" };
      mockFrom.mockReturnValue(createChainMock({ data: newTrack, error: null }));

      const result = await createTrack({ title: "New Track", user_id: "u1" } as never);
      expect(result).toEqual(newTrack);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "insert failed" } }));

      await expect(createTrack({ title: "New Track" } as never)).rejects.toThrow("insert failed");
    });
  });

  describe("updateTrack", () => {
    it("updates track", async () => {
      const updated = { id: "t1", title: "Updated" };
      mockFrom.mockReturnValue(createChainMock({ data: updated, error: null }));

      const result = await updateTrack("t1", { title: "Updated" });
      expect(result).toEqual(updated);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "update failed" } }));

      await expect(updateTrack("t1", { title: "Updated" })).rejects.toThrow("update failed");
    });
  });

  describe("deleteTrack", () => {
    it("deletes track", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await deleteTrack("t1");
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "t1");
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "delete failed" } }));

      await expect(deleteTrack("t1")).rejects.toThrow("delete failed");
    });
  });

  describe("countUserTracks", () => {
    it("returns track count", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: 42 }));

      const result = await countUserTracks("u1");
      expect(result).toBe(42);
    });

    it("returns 0 when count is null", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null, count: null }));

      const result = await countUserTracks("u1");
      expect(result).toBe(0);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "count failed" }, count: null }));

      await expect(countUserTracks("u1")).rejects.toThrow("count failed");
    });
  });

  describe("fetchTrackLikesWithUser", () => {
    it("returns empty for empty track list", async () => {
      const result = await fetchTrackLikesWithUser([]);
      expect(result.counts).toEqual({});
      expect(result.userLikes.size).toBe(0);
    });

    it("counts likes and identifies user likes", async () => {
      const mockData = [
        { track_id: "t1", user_id: "u1" },
        { track_id: "t1", user_id: "u2" },
        { track_id: "t2", user_id: "u1" },
      ];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchTrackLikesWithUser(["t1", "t2"], "u1");
      expect(result.counts).toEqual({ t1: 2, t2: 1 });
      expect(result.userLikes.has("t1")).toBe(true);
      expect(result.userLikes.has("t2")).toBe(true);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "likes failed" } }));

      await expect(fetchTrackLikesWithUser(["t1"])).rejects.toThrow("likes failed");
    });
  });

  describe("toggleTrackLike", () => {
    it("removes like when currently liked", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await toggleTrackLike("t1", "u1", true);
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("track_id", "t1");
    });

    it("adds like when not currently liked", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await toggleTrackLike("t1", "u1", false);
      expect(chain.insert).toHaveBeenCalled();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "toggle failed" } }));

      await expect(toggleTrackLike("t1", "u1", true)).rejects.toThrow("toggle failed");
    });
  });

  describe("incrementPlayCount", () => {
    it("calls RPC to increment play count", async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await incrementPlayCount("t1");
      expect(mockRpc).toHaveBeenCalledWith("increment_track_play_count", { track_id_param: "t1" });
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });

      await expect(incrementPlayCount("t1")).rejects.toThrow("rpc failed");
    });
  });

  describe("fetchTrackVersions", () => {
    it("fetches versions for a track", async () => {
      const mockData = [
        { id: "v1", version_label: "A", audio_url: "url1", is_primary: true },
        { id: "v2", version_label: "B", audio_url: "url2", is_primary: false },
      ];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchTrackVersions("t1");
      expect(result).toEqual(mockData);
    });

    it("returns empty array when null", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchTrackVersions("t1");
      expect(result).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "versions failed" } }));

      await expect(fetchTrackVersions("t1")).rejects.toThrow("versions failed");
    });
  });

  describe("fetchTrackVersionsDetailed", () => {
    it("fetches detailed versions", async () => {
      const mockData = [{ id: "v1", version_label: "A", audio_url: "url1", cover_url: "cover1", clip_index: 0 }];
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchTrackVersionsDetailed("t1");
      expect(result).toEqual(mockData);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "detailed failed" } }));

      await expect(fetchTrackVersionsDetailed("t1")).rejects.toThrow("detailed failed");
    });
  });

  describe("fetchParentTrack", () => {
    it("returns parent track when found", async () => {
      const mockData = { id: "t1", title: "Parent", user_id: "u1" };
      mockFrom.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchParentTrack("t1");
      expect(result).toEqual(mockData);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchParentTrack("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null on error (non-throwing)", async () => {
      mockFrom.mockReturnValue(createChainMock({ data: null, error: { message: "not found" } }));

      const result = await fetchParentTrack("t1");
      expect(result).toBeNull();
    });
  });
});
