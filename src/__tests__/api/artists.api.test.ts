/**
 * Unit tests for artists.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchUserArtists,
  fetchPublicArtists,
  fetchArtistById,
  fetchArtistSummary,
  createArtist,
  updateArtist,
  deleteArtist,
  countUserArtists,
  generateArtistPortrait,
  fetchArtistTrackStats,
} from "@/api/artists.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "limit", "in", "single", "maybeSingle"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  chain.maybeSingle.mockReturnValue(Promise.resolve(result));
  const thenable = { ...chain };
  thenable.then = (resolve: (v: unknown) => void) => resolve(result);
  for (const m of Object.keys(chain)) {
    if (m !== "then") chain[m].mockReturnValue(thenable);
  }
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("artists.api", () => {
  describe("fetchUserArtists", () => {
    it("fetches artists for user", async () => {
      const artists = [{ id: "a1", name: "DJ Bot" }];
      mockFrom.mockReturnValue(chainMock({ data: artists, error: null }));
      const res = await fetchUserArtists("u1");
      expect(res).toEqual(artists);
    });

    it("returns empty array when null data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchUserArtists("u1");
      expect(res).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      await expect(fetchUserArtists("u1")).rejects.toThrow("fail");
    });
  });

  describe("fetchPublicArtists", () => {
    it("fetches public artists", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ id: "a1" }], error: null }));
      const res = await fetchPublicArtists();
      expect(res).toHaveLength(1);
    });

    it("applies limit", async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await fetchPublicArtists(10);
      expect(chain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("fetchArtistById", () => {
    it("fetches single artist", async () => {
      const artist = { id: "a1", name: "Suno Bot" };
      mockFrom.mockReturnValue(chainMock({ data: artist, error: null }));
      const res = await fetchArtistById("a1");
      expect(res).toEqual(artist);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchArtistById("nonexistent");
      expect(res).toBeNull();
    });
  });

  describe("fetchArtistSummary", () => {
    it("fetches summary fields", async () => {
      const summary = { id: "a1", name: "Bot", avatar_url: "url", genre_tags: ["pop"] };
      mockFrom.mockReturnValue(chainMock({ data: summary, error: null }));
      const res = await fetchArtistSummary("a1");
      expect(res).toEqual(summary);
    });

    it("returns null on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      const res = await fetchArtistSummary("a1");
      expect(res).toBeNull();
    });
  });

  describe("createArtist", () => {
    it("creates and returns artist", async () => {
      const artist = { id: "a1", name: "New Bot", user_id: "u1" };
      mockFrom.mockReturnValue(chainMock({ data: artist, error: null }));
      const res = await createArtist({ name: "New Bot", user_id: "u1" });
      expect(res).toEqual(artist);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert failed" } }));
      await expect(createArtist({ name: "X", user_id: "u1" })).rejects.toThrow("insert failed");
    });
  });

  describe("updateArtist", () => {
    it("updates and returns artist", async () => {
      const updated = { id: "a1", name: "Updated" };
      mockFrom.mockReturnValue(chainMock({ data: updated, error: null }));
      const res = await updateArtist("a1", { name: "Updated" });
      expect(res).toEqual(updated);
    });
  });

  describe("deleteArtist", () => {
    it("deletes artist without error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(deleteArtist("a1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "delete failed" } }));
      await expect(deleteArtist("a1")).rejects.toThrow("delete failed");
    });
  });

  describe("countUserArtists", () => {
    it("returns count", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: 5 }));
      expect(await countUserArtists("u1")).toBe(5);
    });

    it("returns 0 when null count", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: null }));
      expect(await countUserArtists("u1")).toBe(0);
    });
  });

  describe("generateArtistPortrait", () => {
    it("invokes edge function", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { imageUrl: "portrait.png" }, error: null });
      const res = await generateArtistPortrait("DJ Bot", "cyberpunk", "ref.png");
      expect(res.imageUrl).toBe("portrait.png");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("generate-artist-portrait", {
        body: { artistName: "DJ Bot", styleDescription: "cyberpunk", referenceImageUrl: "ref.png" },
      });
    });

    it("throws on error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "gen failed" } });
      await expect(generateArtistPortrait("Bot")).rejects.toThrow("gen failed");
    });
  });

  describe("fetchArtistTrackStats", () => {
    it("aggregates tracks and likes", async () => {
      // First call: tracks
      const tracksChain = chainMock({
        data: [
          { id: "t1", play_count: 10 },
          { id: "t2", play_count: 5 },
        ],
        error: null,
        count: 2,
      });
      // Second call: likes
      const likesChain = chainMock({ data: null, error: null, count: 15 });
      mockFrom.mockReturnValueOnce(tracksChain).mockReturnValueOnce(likesChain);
      const res = await fetchArtistTrackStats("a1", ["t1", "t2"]);
      expect(res.tracks).toBe(2);
      expect(res.totalPlays).toBe(15);
      expect(res.totalLikes).toBe(15);
    });

    it("handles empty track list", async () => {
      const tracksChain = chainMock({ data: [], error: null, count: 0 });
      const likesChain = chainMock({ data: null, error: null, count: 0 });
      mockFrom.mockReturnValueOnce(tracksChain).mockReturnValueOnce(likesChain);
      const res = await fetchArtistTrackStats("a1");
      expect(res.tracks).toBe(0);
      expect(res.totalPlays).toBe(0);
      expect(res.totalLikes).toBe(0);
    });
  });
});
