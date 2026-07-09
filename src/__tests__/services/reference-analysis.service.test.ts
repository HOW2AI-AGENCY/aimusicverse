/**
 * Unit tests for audio-reference/reference-analysis.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as analysisApi from "@/api/analysis.api";
import { analyzeReferenceAudio } from "@/services/audio-reference/reference-analysis.service";

vi.mock("@/api/analysis.api", () => ({
  invokeReferenceAudioAnalysis: vi.fn(),
}));

describe("audio-reference/reference-analysis.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeReferenceAudio", () => {
    it("maps full analysis result from edge function", async () => {
      vi.mocked(analysisApi.invokeReferenceAudioAnalysis).mockResolvedValue({
        data: {
          bpm: 120,
          key: "C major",
          genre: "rock",
          mood: "energetic",
          energy: "high",
          instruments: ["guitar", "drums"],
          chords: ["C", "G", "Am"],
          style_description: "Classic rock",
          vocal_style: "male",
          suggested_tags: ["rock", "guitar"],
        },
        error: null,
      });

      const result = await analyzeReferenceAudio({
        audioUrl: "https://cdn.example.com/ref.wav",
        detectBpm: true,
        detectChords: true,
      });

      expect(result?.bpm).toBe(120);
      expect(result?.key).toBe("C major");
      expect(result?.genre).toBe("rock");
      expect(result?.instruments).toEqual(["guitar", "drums"]);
      expect(result?.chords).toEqual(["C", "G", "Am"]);
    });

    it("returns null when data is empty", async () => {
      vi.mocked(analysisApi.invokeReferenceAudioAnalysis).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await analyzeReferenceAudio({
        audioUrl: "https://cdn.example.com/ref.wav",
      });

      expect(result).toBeNull();
    });

    it("throws on error", async () => {
      vi.mocked(analysisApi.invokeReferenceAudioAnalysis).mockResolvedValue({
        data: null,
        error: { message: "Analysis failed" },
      });

      await expect(analyzeReferenceAudio({ audioUrl: "https://cdn.example.com/ref.wav" })).rejects.toThrow(
        "Analysis failed",
      );
    });

    it("maps partial results — missing fields become undefined", async () => {
      vi.mocked(analysisApi.invokeReferenceAudioAnalysis).mockResolvedValue({
        data: { bpm: 100, genre: "jazz" },
        error: null,
      });

      const result = await analyzeReferenceAudio({
        audioUrl: "https://cdn.example.com/ref.wav",
      });

      expect(result?.bpm).toBe(100);
      expect(result?.genre).toBe("jazz");
      expect(result?.key).toBeUndefined();
    });
  });
});
