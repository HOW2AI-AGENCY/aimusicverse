/**
 * Unit tests for playlists.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchUserPlaylists,
  fetchPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  fetchPlaylistTracks,
  fetchPlaylistTracksWithDetails,
  getMaxPosition,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  updateTrackPosition,
  fetchPlaylistsContainingTrack,
} from "@/api/playlists.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "limit", "single", "maybeSingle"]) {
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

describe("playlists.api", () => {
  describe("fetchUserPlaylists", () => {
    it("fetches playlists for user", async () => {
      const playlists = [{ id: "p1", name: "My Playlist" }];
      mockFrom.mockReturnValue(chainMock({ data: playlists, error: null }));
      const res = await fetchUserPlaylists("u1");
      expect(res).toEqual(playlists);
    });

    it("returns empty array when null", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchUserPlaylists("u1")).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      await expect(fetchUserPlaylists("u1")).rejects.toThrow("fail");
    });
  });

  describe("fetchPlaylistById", () => {
    it("fetches single playlist", async () => {
      const playlist = { id: "p1", name: "Chill" };
      mockFrom.mockReturnValue(chainMock({ data: playlist, error: null }));
      expect(await fetchPlaylistById("p1")).toEqual(playlist);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchPlaylistById("nonexistent")).toBeNull();
    });
  });

  describe("createPlaylist", () => {
    it("creates and returns playlist", async () => {
      const playlist = { id: "p1", name: "New", user_id: "u1" };
      mockFrom.mockReturnValue(chainMock({ data: playlist, error: null }));
      const res = await createPlaylist({ name: "New", user_id: "u1" });
      expect(res).toEqual(playlist);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert fail" } }));
      await expect(createPlaylist({ name: "X", user_id: "u1" })).rejects.toThrow("insert fail");
    });
  });

  describe("updatePlaylist", () => {
    it("updates and returns playlist", async () => {
      const updated = { id: "p1", name: "Updated" };
      mockFrom.mockReturnValue(chainMock({ data: updated, error: null }));
      const res = await updatePlaylist("p1", { name: "Updated" });
      expect(res).toEqual(updated);
    });
  });

  describe("deletePlaylist", () => {
    it("deletes without error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(deletePlaylist("p1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "delete fail" } }));
      await expect(deletePlaylist("p1")).rejects.toThrow("delete fail");
    });
  });

  describe("fetchPlaylistTracks", () => {
    it("fetches tracks ordered by position", async () => {
      const tracks = [
        { id: "pt1", position: 0 },
        { id: "pt2", position: 1 },
      ];
      mockFrom.mockReturnValue(chainMock({ data: tracks, error: null }));
      const res = await fetchPlaylistTracks("p1");
      expect(res).toEqual(tracks);
    });
  });

  describe("fetchPlaylistTracksWithDetails", () => {
    it("fetches tracks with joined track data", async () => {
      const tracks = [{ id: "pt1", track: { id: "t1", title: "Song" } }];
      mockFrom.mockReturnValue(chainMock({ data: tracks, error: null }));
      const res = await fetchPlaylistTracksWithDetails("p1");
      expect(res).toEqual(tracks);
    });
  });

  describe("getMaxPosition", () => {
    it("returns max position", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ position: 5 }], error: null }));
      expect(await getMaxPosition("p1")).toBe(5);
    });

    it("returns -1 when no tracks", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
      expect(await getMaxPosition("p1")).toBe(-1);
    });
  });

  describe("addTrackToPlaylist", () => {
    it("adds track and returns row", async () => {
      const row = { id: "pt1", playlist_id: "p1", track_id: "t1", position: 0 };
      mockFrom.mockReturnValue(chainMock({ data: row, error: null }));
      const res = await addTrackToPlaylist("p1", "t1", 0);
      expect(res).toEqual(row);
    });

    it("throws duplicate error on 23505", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "duplicate", code: "23505" } }));
      await expect(addTrackToPlaylist("p1", "t1", 0)).rejects.toThrow("Трек уже в плейлисте");
    });

    it("throws generic error on other codes", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "other error", code: "PGRST" } }));
      await expect(addTrackToPlaylist("p1", "t1", 0)).rejects.toThrow("other error");
    });
  });

  describe("removeTrackFromPlaylist", () => {
    it("removes track", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(removeTrackFromPlaylist("p1", "t1")).resolves.toBeUndefined();
    });
  });

  describe("updateTrackPosition", () => {
    it("updates position", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(updateTrackPosition("p1", "t1", 3)).resolves.toBeUndefined();
    });
  });

  describe("fetchPlaylistsContainingTrack", () => {
    it("returns playlists containing track", async () => {
      const data = [
        { playlist_id: "p1", playlists: { id: "p1", name: "Playlist 1" } },
        { playlist_id: "p2", playlists: { id: "p2", name: "Playlist 2" } },
      ];
      mockFrom.mockReturnValue(chainMock({ data, error: null }));
      const res = await fetchPlaylistsContainingTrack("t1");
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe("p1");
    });

    it("returns empty when no playlists", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
      expect(await fetchPlaylistsContainingTrack("t1")).toEqual([]);
    });
  });
});
