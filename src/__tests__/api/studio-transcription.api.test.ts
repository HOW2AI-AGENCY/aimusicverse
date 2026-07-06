/**
 * Unit tests for studio/studio-transcription.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchStemTranscriptions,
  fetchStemTranscriptionsByStemIds,
  invokeExportMidi,
  fetchLatestStemTranscriptionByStemId,
  fetchLatestStemTranscriptionByTrackId,
  invokeReplicateMidiTranscription,
  invokeKlangioAnalyze,
} from "@/api/studio/studio-transcription.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "eq", "in", "order", "limit", "single", "maybeSingle"]) {
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

describe("studio-transcription.api", () => {
  describe("fetchStemTranscriptions", () => {
    it("fetches with trackId filter", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ id: "tr1" }], error: null }));
      const res = await fetchStemTranscriptions({ trackId: "t1" });
      expect(res.data).toHaveLength(1);
    });

    it("fetches with stemId filter", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
      const res = await fetchStemTranscriptions({ stemId: "s1" });
      expect(res.data).toEqual([]);
    });
  });

  describe("fetchStemTranscriptionsByStemIds", () => {
    it("fetches by stem IDs", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [{ id: "tr1", stem_id: "s1" }], error: null }));
      const res = await fetchStemTranscriptionsByStemIds(["s1", "s2"]);
      expect(res.data).toHaveLength(1);
    });
  });

  describe("invokeExportMidi", () => {
    it("invokes export-midi edge function", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { midiUrl: "midi.mid" }, error: null });
      const res = await invokeExportMidi({
        notes: [{ pitch: 60, start: 0, duration: 1 }],
        bpm: 120,
        timeSignature: "4/4",
        trackName: "Song",
      });
      expect(res.data?.midiUrl).toBe("midi.mid");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("export-midi", expect.any(Object));
    });
  });

  describe("fetchLatestStemTranscriptionByStemId", () => {
    it("fetches latest transcription", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { id: "tr1", stem_id: "s1" }, error: null }));
      const res = await fetchLatestStemTranscriptionByStemId("s1");
      expect(res?.stem_id).toBe("s1");
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchLatestStemTranscriptionByStemId("nonexistent");
      expect(res).toBeNull();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "db error" } }));
      await expect(fetchLatestStemTranscriptionByStemId("s1")).rejects.toThrow();
    });
  });

  describe("fetchLatestStemTranscriptionByTrackId", () => {
    it("fetches latest transcription by track ID", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { id: "tr1", track_id: "t1" }, error: null }));
      const res = await fetchLatestStemTranscriptionByTrackId("t1");
      expect(res?.track_id).toBe("t1");
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchLatestStemTranscriptionByTrackId("t1")).toBeNull();
    });
  });

  describe("invokeReplicateMidiTranscription", () => {
    it("invokes replicate-midi-transcription", async () => {
      const response = { success: true, midiUrl: "midi.mid", notes_count: 50 };
      mockFunctions.invoke.mockResolvedValue({ data: response, error: null });
      const res = await invokeReplicateMidiTranscription({ audioUrl: "audio.mp3" });
      expect(res.data?.midiUrl).toBe("midi.mid");
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "replicate failed" } });
      const res = await invokeReplicateMidiTranscription({ audioUrl: "audio.mp3" });
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("replicate failed");
    });
  });

  describe("invokeKlangioAnalyze", () => {
    it("invokes klangio-analyze", async () => {
      const response = { success: true, midi_url: "midi.mid", bpm: 120 };
      mockFunctions.invoke.mockResolvedValue({ data: response, error: null });
      const res = await invokeKlangioAnalyze({ audio_url: "audio.mp3" });
      expect(res.data?.midi_url).toBe("midi.mid");
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "klangio failed" } });
      const res = await invokeKlangioAnalyze({ audio_url: "audio.mp3" });
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("klangio failed");
    });
  });
});
