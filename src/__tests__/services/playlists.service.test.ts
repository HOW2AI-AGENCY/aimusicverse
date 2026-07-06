/**
 * Unit tests for playlists.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPlaylist, addTrackToPlaylist, moveTrack, duplicatePlaylist } from "@/services/playlists.service";
import * as playlistsApi from "@/api/playlists.api";

vi.mock("@/api/playlists.api", () => ({
  createPlaylist: vi.fn(),
  getMaxPosition: vi.fn(),
  addTrackToPlaylist: vi.fn(),
  fetchPlaylistTracks: vi.fn(),
  reorderPlaylistTracks: vi.fn(),
  fetchPlaylistById: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const mockCreate = playlistsApi.createPlaylist as unknown as ReturnType<typeof vi.fn>;
const mockGetMax = playlistsApi.getMaxPosition as unknown as ReturnType<typeof vi.fn>;
const mockAddTrack = playlistsApi.addTrackToPlaylist as unknown as ReturnType<typeof vi.fn>;
const mockFetchTracks = playlistsApi.fetchPlaylistTracks as unknown as ReturnType<typeof vi.fn>;
const mockReorder = playlistsApi.reorderPlaylistTracks as unknown as ReturnType<typeof vi.fn>;
const mockFetchById = playlistsApi.fetchPlaylistById as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe("playlists.service", () => {
  describe("createPlaylist", () => {
    it("creates playlist with default settings", async () => {
      const playlist = { id: "p1", title: "My Playlist" };
      mockCreate.mockResolvedValue(playlist);
      const res = await createPlaylist("u1", "My Playlist");
      expect(res).toEqual(playlist);
      expect(mockCreate).toHaveBeenCalledWith({
        user_id: "u1",
        title: "My Playlist",
        description: null,
        is_public: false,
      });
    });

    it("passes description and isPublic", async () => {
      mockCreate.mockResolvedValue({ id: "p1" });
      await createPlaylist("u1", "Mix", "Summer vibes", true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Summer vibes",
          is_public: true,
        }),
      );
    });
  });

  describe("addTrackToPlaylist", () => {
    it("adds track at max position + 1", async () => {
      mockGetMax.mockResolvedValue(3);
      mockAddTrack.mockResolvedValue({ id: "pt1", position: 4 });
      const res = await addTrackToPlaylist("p1", "t1");
      expect(mockGetMax).toHaveBeenCalledWith("p1");
      expect(mockAddTrack).toHaveBeenCalledWith("p1", "t1", 4);
    });

    it("adds first track at position 0 when empty", async () => {
      mockGetMax.mockResolvedValue(-1);
      mockAddTrack.mockResolvedValue({ id: "pt1", position: 0 });
      await addTrackToPlaylist("p1", "t1");
      expect(mockAddTrack).toHaveBeenCalledWith("p1", "t1", 0);
    });
  });

  describe("moveTrack", () => {
    it("reorders tracks by splicing", async () => {
      const tracks = [
        { track_id: "t1", position: 0 },
        { track_id: "t2", position: 1 },
        { track_id: "t3", position: 2 },
      ];
      mockFetchTracks.mockResolvedValue(tracks);
      mockReorder.mockResolvedValue(undefined);
      await moveTrack("p1", "t1", 0, 2);
      expect(mockReorder).toHaveBeenCalledWith("p1", ["t2", "t3", "t1"]);
    });
  });

  describe("duplicatePlaylist", () => {
    it("duplicates playlist with tracks", async () => {
      const source = { id: "p1", title: "Original", description: "desc" };
      const newPlaylist = { id: "p2", title: "Copy" };
      const sourceTracks = [
        { track_id: "t1", position: 0 },
        { track_id: "t2", position: 1 },
      ];

      mockFetchById.mockResolvedValue(source);
      mockCreate.mockResolvedValue(newPlaylist);
      mockFetchTracks.mockResolvedValue(sourceTracks);
      mockAddTrack.mockResolvedValue({});

      const res = await duplicatePlaylist("u1", "p1", "Copy");
      expect(res).toEqual(newPlaylist);
      expect(mockCreate).toHaveBeenCalledWith({
        user_id: "u1",
        title: "Copy",
        description: "desc",
        is_public: false,
      });
      expect(mockAddTrack).toHaveBeenCalledTimes(2);
    });

    it("throws when source not found", async () => {
      mockFetchById.mockResolvedValue(null);
      await expect(duplicatePlaylist("u1", "nonexistent", "Copy")).rejects.toThrow("Плейлист не найден");
    });
  });
});
