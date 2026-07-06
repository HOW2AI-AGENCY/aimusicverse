/**
 * Unit tests for studio/studio-tracks.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTrackVersions,
  fetchTrackStems,
  fetchTrackStemsByTypes,
  fetchTrackStemByType,
  fetchLatestStemTranscription,
  fetchVersionTranscriptionData,
  fetchSourceTrackForStudio,
  invokeStemSeparation,
  fetchGuitarAnalysis,
  ensureTrackVersion,
} from "@/api/studio/studio-tracks.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "in", "order", "limit", "single", "maybeSingle"]) {
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

describe("studio-tracks.api", () => {
  describe("fetchTrackVersions", () => {
    it("fetches versions for track", async () => {
      const versions = [{ id: "v1", track_id: "t1" }];
      mockFrom.mockReturnValue(chainMock({ data: versions, error: null }));
      const res = await fetchTrackVersions("t1");
      expect(res.data).toEqual(versions);
      expect(res.error).toBeNull();
    });
  });

  describe("fetchTrackStems", () => {
    it("fetches stems for track", async () => {
      const stems = [{ id: "s1", stem_type: "vocals" }];
      mockFrom.mockReturnValue(chainMock({ data: stems, error: null }));
      const res = await fetchTrackStems("t1");
      expect(res.data).toEqual(stems);
    });
  });

  describe("fetchTrackStemsByTypes", () => {
    it("fetches stems filtered by types", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ id: "s1", stem_type: "vocals" }], error: null }));
      const res = await fetchTrackStemsByTypes("t1", ["vocals", "drums"]);
      expect(res.data).toHaveLength(1);
    });
  });

  describe("fetchTrackStemByType", () => {
    it("fetches single stem by type", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { id: "s1" }, error: null }));
      const res = await fetchTrackStemByType("t1", "vocals");
      expect(res.data?.id).toBe("s1");
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchTrackStemByType("t1", "bass");
      expect(res.data).toBeNull();
    });
  });

  describe("fetchLatestStemTranscription", () => {
    it("fetches latest transcription", async () => {
      const transcription = [{ id: "tr1", stem_id: "s1" }];
      mockFrom.mockReturnValue(chainMock({ data: transcription, error: null }));
      const res = await fetchLatestStemTranscription("s1");
      expect(res.data).toEqual(transcription);
    });
  });

  describe("fetchVersionTranscriptionData", () => {
    it("fetches transcription data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { transcription_data: { notes: [] } }, error: null }));
      const res = await fetchVersionTranscriptionData("v1");
      expect(res.data?.transcription_data).toBeTruthy();
    });
  });

  describe("fetchSourceTrackForStudio", () => {
    it("fetches source track fields", async () => {
      const track = { id: "t1", lyrics: "Hello", suno_task_id: "st1" };
      mockFrom.mockReturnValue(chainMock({ data: track, error: null }));
      const res = await fetchSourceTrackForStudio("t1");
      expect(res.data).toEqual(track);
    });
  });

  describe("invokeStemSeparation", () => {
    it("invokes suno-separate-vocals", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });
      const res = await invokeStemSeparation({
        trackId: "t1",
        audioId: "a1",
        audioUrl: "audio.mp3",
        mode: "simple",
        userId: "u1",
      });
      expect(res.data?.success).toBe(true);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-separate-vocals", {
        body: { trackId: "t1", audioId: "a1", audioUrl: "audio.mp3", mode: "simple", userId: "u1" },
      });
    });
  });

  describe("fetchGuitarAnalysis", () => {
    it("fetches guitar recording", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { id: "gr1" }, error: null }));
      const res = await fetchGuitarAnalysis("t1");
      expect(res.data?.id).toBe("gr1");
    });
  });

  describe("ensureTrackVersion", () => {
    it("calls rpc and returns data", async () => {
      mockRpc.mockResolvedValue({ data: "version-id-123", error: null });
      const res = await ensureTrackVersion({ trackId: "t1", audioUrl: "audio.mp3", label: "v1" });
      expect(res).toBe("version-id-123");
      expect(mockRpc).toHaveBeenCalledWith(
        "ensure_track_version",
        expect.objectContaining({
          p_track_id: "t1",
          p_audio_url: "audio.mp3",
          p_label: "v1",
        }),
      );
    });

    it("throws on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });
      await expect(ensureTrackVersion({ trackId: "t1", audioUrl: "a.mp3" })).rejects.toThrow("rpc failed");
    });
  });
});
