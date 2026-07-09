/**
 * Unit tests for track-detail/track-detail.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import * as tracksApi from "@/api/tracks.api";
import * as artistsApi from "@/api/artists.api";
import * as notificationsApi from "@/api/notifications.api";

vi.mock("@/api/tracks.api", () => ({
  fetchTrackVersionsDetailed: vi.fn(),
  fetchParentTrack: vi.fn(),
}));

vi.mock("@/api/artists.api", () => ({
  fetchArtistSummary: vi.fn(),
}));

vi.mock("@/api/notifications.api", () => ({
  sendVideoShareNotification: vi.fn(),
}));

import {
  fetchTrackVersionsForSelector,
  fetchParentTrackSummary,
  fetchTrackArtist,
  fetchTrackProject,
  fetchTrackReferenceAudio,
  sendTrackVideoToTelegram,
} from "@/services/track-detail/track-detail.service";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "in", "is", "or", "order", "limit", "not"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.single = vi.fn().mockResolvedValue(finalResult);
  return chain;
}

describe("track-detail/track-detail.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchTrackVersionsForSelector", () => {
    it("delegates to fetchTrackVersionsDetailed", async () => {
      const versions = [{ id: "v1", version_label: "A" }];
      vi.mocked(tracksApi.fetchTrackVersionsDetailed).mockResolvedValue(versions as never);

      const result = await fetchTrackVersionsForSelector("track-1");

      expect(result).toEqual(versions);
      expect(tracksApi.fetchTrackVersionsDetailed).toHaveBeenCalledWith("track-1");
    });
  });

  describe("fetchParentTrackSummary", () => {
    it("delegates to fetchParentTrack", async () => {
      const parent = { id: "p1", title: "Parent", style: "pop" };
      vi.mocked(tracksApi.fetchParentTrack).mockResolvedValue(parent as never);

      const result = await fetchParentTrackSummary("p1");

      expect(result).toEqual(parent);
    });
  });

  describe("fetchTrackArtist", () => {
    it("delegates to fetchArtistSummary", async () => {
      const artist = { id: "a1", name: "Artist", genre_tags: ["pop"] };
      vi.mocked(artistsApi.fetchArtistSummary).mockResolvedValue(artist as never);

      const result = await fetchTrackArtist("a1");

      expect(result).toEqual(artist);
    });
  });

  describe("fetchTrackProject", () => {
    it("returns project on success", async () => {
      const chain = createChainMock({
        data: { id: "proj-1", title: "Project", cover_url: null, genre: "kpop" },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTrackProject("proj-1");

      expect(chain.select).toHaveBeenCalledWith("id, title, cover_url, genre");
      expect(chain.eq).toHaveBeenCalledWith("id", "proj-1");
      expect(result?.title).toBe("Project");
    });

    it("returns null on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      const result = await fetchTrackProject("proj-1");

      expect(result).toBeNull();
    });
  });

  describe("fetchTrackReferenceAudio", () => {
    it("returns null when history has no reference_audio_id", async () => {
      const historyChain = createChainMock({ data: null, error: null });
      historyChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(historyChain);

      const result = await fetchTrackReferenceAudio("track-1");

      expect(result).toBeNull();
    });

    it("returns reference audio when history has reference_audio_id", async () => {
      const historyChain = createChainMock({ data: null, error: null });
      historyChain.maybeSingle = vi.fn().mockResolvedValue({
        data: { reference_audio_id: "ref-1" },
        error: null,
      });
      const refChain = createChainMock({ data: null, error: null });
      refChain.maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "ref-1", file_name: "audio.wav", file_url: "https://cdn.example.com/r.wav", genre: "rock" },
        error: null,
      });

      mockFrom.mockReturnValueOnce(historyChain).mockReturnValueOnce(refChain);

      const result = await fetchTrackReferenceAudio("track-1");

      expect(result?.file_name).toBe("audio.wav");
    });
  });

  describe("sendTrackVideoToTelegram", () => {
    it("calls sendVideoShareNotification with payload", async () => {
      vi.mocked(notificationsApi.sendVideoShareNotification).mockResolvedValue();

      await sendTrackVideoToTelegram("track-1", "https://cdn.example.com/video.mp4", "My Video");

      expect(notificationsApi.sendVideoShareNotification).toHaveBeenCalledWith({
        type: "video_share",
        trackId: "track-1",
        videoUrl: "https://cdn.example.com/video.mp4",
        title: "My Video",
      });
    });
  });
});
