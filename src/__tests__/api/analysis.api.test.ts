/**
 * Unit tests for analysis.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTrackAnalysis,
  createAudioAnalysis,
  uploadAudioForAnalysis,
  createTempAnalysisTrack,
  deleteTempAnalysisTrack,
  invokeMidiTranscription,
  invokeAudioAnalysis,
  invokeLyricsTranscription,
  invokeReferenceAudioAnalysis,
  saveGuitarRecording,
} from "@/api/analysis.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };
const mockStorage = supabase.storage as unknown as { from: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown }) {
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

describe("analysis.api", () => {
  describe("fetchTrackAnalysis", () => {
    it("fetches latest analysis for track", async () => {
      const analysis = { id: "a1", track_id: "t1", bpm: 120, genre: "pop" };
      mockFrom.mockReturnValue(chainMock({ data: analysis, error: null }));
      const res = await fetchTrackAnalysis("t1");
      expect(res).toEqual(analysis);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchTrackAnalysis("t1")).toBeNull();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "db error" } }));
      await expect(fetchTrackAnalysis("t1")).rejects.toThrow("db error");
    });
  });

  describe("createAudioAnalysis", () => {
    it("creates and returns analysis", async () => {
      const analysis = { id: "a1", track_id: "t1", bpm: 120 };
      mockFrom.mockReturnValue(chainMock({ data: analysis, error: null }));
      const res = await createAudioAnalysis({
        trackId: "t1",
        userId: "u1",
        analysisType: "auto",
        bpm: 120,
        genre: "pop",
      });
      expect(res).toEqual(analysis);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert fail" } }));
      await expect(createAudioAnalysis({ trackId: "t1", userId: "u1", analysisType: "auto" })).rejects.toThrow(
        "insert fail",
      );
    });
  });

  describe("uploadAudioForAnalysis", () => {
    it("uploads file and returns public URL", async () => {
      const bucket = {
        upload: vi.fn().mockResolvedValue({ data: { path: "test.mp3" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/test.mp3" } }),
      };
      mockStorage.from.mockReturnValue(bucket);
      const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
      const url = await uploadAudioForAnalysis(file, "u1");
      expect(url).toBe("https://cdn.example.com/test.mp3");
    });

    it("throws on upload error", async () => {
      const bucket = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "upload failed" } }),
      };
      mockStorage.from.mockReturnValue(bucket);
      await expect(uploadAudioForAnalysis(new File(["x"], "x.mp3"), "u1")).rejects.toThrow("upload failed");
    });
  });

  describe("createTempAnalysisTrack", () => {
    it("creates temp track and returns ID", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { id: "temp-t1" }, error: null }));
      const id = await createTempAnalysisTrack("u1", "https://audio.mp3");
      expect(id).toBe("temp-t1");
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert fail" } }));
      await expect(createTempAnalysisTrack("u1", "url")).rejects.toThrow("insert fail");
    });
  });

  describe("deleteTempAnalysisTrack", () => {
    it("deletes temp track", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(deleteTempAnalysisTrack("t1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "delete fail" } }));
      await expect(deleteTempAnalysisTrack("t1")).rejects.toThrow("delete fail");
    });
  });

  describe("invokeMidiTranscription", () => {
    it("invokes transcribe-midi and returns success", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { notes: [] }, error: null });
      const res = await invokeMidiTranscription({ trackId: "t1", audioUrl: "audio.mp3" });
      expect(res.success).toBe(true);
      expect(res.data).toBeTruthy();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "transcription failed" } });
      const res = await invokeMidiTranscription({ trackId: "t1", audioUrl: "audio.mp3" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("transcription failed");
    });
  });

  describe("invokeAudioAnalysis", () => {
    it("invokes analyze-audio-flamingo", async () => {
      const result = { success: true, parsed: { genre: "rock" } };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await invokeAudioAnalysis({ audioUrl: "audio.mp3" });
      expect(res.data?.parsed?.genre).toBe("rock");
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "analysis failed" } });
      const res = await invokeAudioAnalysis({ audioUrl: "audio.mp3" });
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("analysis failed");
    });
  });

  describe("invokeLyricsTranscription", () => {
    it("invokes transcribe-lyrics", async () => {
      const result = { lyrics: "Hello world", has_vocals: true };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await invokeLyricsTranscription({ audioUrl: "audio.mp3" });
      expect(res.data?.lyrics).toBe("Hello world");
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "lyrics failed" } });
      const res = await invokeLyricsTranscription({ audioUrl: "audio.mp3" });
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("lyrics failed");
    });
  });

  describe("invokeReferenceAudioAnalysis", () => {
    it("invokes analyze-reference-audio", async () => {
      const result = { bpm: 120, key: "C", genre: "pop" };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await invokeReferenceAudioAnalysis({ audioUrl: "audio.mp3" });
      expect(res.data?.bpm).toBe(120);
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "ref failed" } });
      const res = await invokeReferenceAudioAnalysis({ audioUrl: "audio.mp3" });
      expect(res.error?.message).toBe("ref failed");
    });
  });

  describe("saveGuitarRecording", () => {
    it("saves and returns recording", async () => {
      const recording = { id: "gr1", user_id: "u1", audio_url: "guitar.mp3" };
      mockFrom.mockReturnValue(chainMock({ data: recording, error: null }));
      const res = await saveGuitarRecording({ userId: "u1", audioUrl: "guitar.mp3", bpm: 120 });
      expect(res).toEqual(recording);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "save fail" } }));
      await expect(saveGuitarRecording({ userId: "u1", audioUrl: "guitar.mp3" })).rejects.toThrow("save fail");
    });
  });
});
