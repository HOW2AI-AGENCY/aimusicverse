/**
 * Unit tests for studio/studio-stems.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import * as studioApi from "@/api/studio.api";

vi.mock("@/api/studio.api", () => ({
  fetchSourceTrackForStudio: vi.fn(),
  fetchTrackStemsByTypes: vi.fn(),
  fetchStemTranscriptions: vi.fn(),
  fetchStemTranscriptionsByStemIds: vi.fn(),
  fetchVersionTranscriptionData: vi.fn(),
  fetchTrackStemByType: vi.fn(),
  fetchLatestStemTranscription: vi.fn(),
  invokeExportMidi: vi.fn(),
  invokeStemSeparation: vi.fn(),
}));

import {
  fetchSourceTrack,
  fetchStemsByTypes,
  fetchMainTrackTranscription,
  fetchTranscriptionsByStemIds,
  fetchVersionTranscription,
  fetchStemTranscriptionForTrackType,
  fetchLatestTranscriptionForTrackOrStem,
  exportMidi,
  separateStems,
} from "@/services/studio/studio-stems.service";

describe("studio/studio-stems.service", () => {
  describe("fetchSourceTrack", () => {
    it("returns null on error", async () => {
      vi.mocked(studioApi.fetchSourceTrackForStudio).mockResolvedValue({ data: null, error: new Error("fail") });
      expect(await fetchSourceTrack("t1")).toBeNull();
    });

    it("returns null when no data", async () => {
      vi.mocked(studioApi.fetchSourceTrackForStudio).mockResolvedValue({ data: null, error: null });
      expect(await fetchSourceTrack("t1")).toBeNull();
    });

    it("returns source track metadata on success", async () => {
      const data = { id: "t1", lyrics: "hello", suno_task_id: "task1", suno_id: "suno1" };
      vi.mocked(studioApi.fetchSourceTrackForStudio).mockResolvedValue({ data, error: null });
      const result = await fetchSourceTrack("t1");
      expect(result?.lyrics).toBe("hello");
    });
  });

  describe("fetchStemsByTypes", () => {
    it("returns stems for matching types", async () => {
      const stems = [{ id: "s1", stem_type: "vocals" }];
      vi.mocked(studioApi.fetchTrackStemsByTypes).mockResolvedValue({ data: stems, error: null });
      const result = await fetchStemsByTypes("t1", ["vocals"]);
      expect(result).toHaveLength(1);
      expect(result[0].stem_type).toBe("vocals");
    });

    it("returns empty on error", async () => {
      vi.mocked(studioApi.fetchTrackStemsByTypes).mockResolvedValue({ data: null, error: new Error("fail") });
      expect(await fetchStemsByTypes("t1", ["vocals"])).toEqual([]);
    });
  });

  describe("fetchMainTrackTranscription", () => {
    it("returns first transcription row", async () => {
      const rows = [{ id: "tr1", bpm: 120 }];
      vi.mocked(studioApi.fetchStemTranscriptions).mockResolvedValue({ data: rows, error: null });
      const result = await fetchMainTrackTranscription("t1");
      expect(result?.id).toBe("tr1");
    });

    it("returns null when no data", async () => {
      vi.mocked(studioApi.fetchStemTranscriptions).mockResolvedValue({ data: null, error: null });
      expect(await fetchMainTrackTranscription("t1")).toBeNull();
    });
  });

  describe("fetchTranscriptionsByStemIds", () => {
    it("returns empty for empty stemIds", async () => {
      expect(await fetchTranscriptionsByStemIds([])).toEqual([]);
    });

    it("delegates to api", async () => {
      const rows = [{ id: "tr1" }];
      vi.mocked(studioApi.fetchStemTranscriptionsByStemIds).mockResolvedValue({ data: rows, error: null });
      const result = await fetchTranscriptionsByStemIds(["s1"]);
      expect(result).toHaveLength(1);
    });
  });

  describe("fetchVersionTranscription", () => {
    it("returns null on error", async () => {
      vi.mocked(studioApi.fetchVersionTranscriptionData).mockResolvedValue({ data: null, error: new Error("fail") });
      expect(await fetchVersionTranscription("v1")).toBeNull();
    });

    it("returns null when transcription_data is not object", async () => {
      vi.mocked(studioApi.fetchVersionTranscriptionData).mockResolvedValue({
        data: { transcription_data: "string" },
        error: null,
      });
      expect(await fetchVersionTranscription("v1")).toBeNull();
    });

    it("returns resolved transcription on success", async () => {
      const data = { transcription_data: { bpm: 120, key_detected: "C" } };
      vi.mocked(studioApi.fetchVersionTranscriptionData).mockResolvedValue({ data, error: null });
      const result = await fetchVersionTranscription("v1");
      expect(result?.bpm).toBe(120);
      expect(result?.key_detected).toBe("C");
    });
  });

  describe("fetchStemTranscriptionForTrackType", () => {
    it("returns null when stem not found", async () => {
      vi.mocked(studioApi.fetchTrackStemByType).mockResolvedValue({ data: null, error: null });
      expect(await fetchStemTranscriptionForTrackType("t1", "vocals")).toBeNull();
    });

    it("returns null when transcription not found", async () => {
      vi.mocked(studioApi.fetchTrackStemByType).mockResolvedValue({ data: { id: "s1" }, error: null });
      vi.mocked(studioApi.fetchLatestStemTranscription).mockResolvedValue({ data: null, error: null });
      expect(await fetchStemTranscriptionForTrackType("t1", "vocals")).toBeNull();
    });

    it("returns transcription when found", async () => {
      vi.mocked(studioApi.fetchTrackStemByType).mockResolvedValue({ data: { id: "s1" }, error: null });
      vi.mocked(studioApi.fetchLatestStemTranscription).mockResolvedValue({ data: [{ bpm: 130 }], error: null });
      const result = await fetchStemTranscriptionForTrackType("t1", "vocals");
      expect(result?.bpm).toBe(130);
    });
  });

  describe("fetchLatestTranscriptionForTrackOrStem", () => {
    it("filters by trackId when provided", async () => {
      vi.mocked(studioApi.fetchStemTranscriptions).mockResolvedValue({ data: [{ bpm: 100 }], error: null });
      const result = await fetchLatestTranscriptionForTrackOrStem("t1", "fallback");
      expect(result?.bpm).toBe(100);
    });

    it("filters by stemId when no trackId", async () => {
      vi.mocked(studioApi.fetchStemTranscriptions).mockResolvedValue({ data: [{ bpm: 90 }], error: null });
      const result = await fetchLatestTranscriptionForTrackOrStem(null, "s1");
      expect(result?.bpm).toBe(90);
    });
  });

  describe("exportMidi", () => {
    it("throws on error", async () => {
      vi.mocked(studioApi.invokeExportMidi).mockResolvedValue({ data: null, error: new Error("export failed") });
      await expect(exportMidi({ notes: [], bpm: 120, timeSignature: "4/4", trackName: "test" })).rejects.toThrow(
        "export failed",
      );
    });

    it("returns result on success", async () => {
      const resultData = { data: "base64midi", success: true };
      vi.mocked(studioApi.invokeExportMidi).mockResolvedValue({ data: resultData, error: null });
      const result = await exportMidi({ notes: [], bpm: 120, timeSignature: "4/4", trackName: "test" });
      expect(result.success).toBe(true);
    });
  });

  describe("separateStems", () => {
    it("returns not authenticated when no user", async () => {
      const authSpy = vi.spyOn(supabase.auth, "getUser").mockResolvedValue({ data: { user: null }, error: null });
      const result = await separateStems("t1", "a1", "https://cdn.example.com/a.mp3", "simple");
      expect(result.error?.message).toBe("Not authenticated");
      authSpy.mockRestore();
    });

    it("calls invokeStemSeparation with userId", async () => {
      const authSpy = vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
        data: { user: { id: "uid" } },
        error: null,
      } as never);
      vi.mocked(studioApi.invokeStemSeparation).mockResolvedValue({ data: null, error: null });

      const result = await separateStems("t1", "a1", "https://cdn.example.com/a.mp3", "detailed");

      expect(studioApi.invokeStemSeparation).toHaveBeenCalledWith({
        trackId: "t1",
        audioId: "a1",
        audioUrl: "https://cdn.example.com/a.mp3",
        mode: "detailed",
        userId: "uid",
      });
      expect(result.success).toBe(true);
      authSpy.mockRestore();
    });
  });
});
