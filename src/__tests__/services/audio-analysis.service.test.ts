/**
 * Unit tests for audio-reference/audio-analysis.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as analysisApi from "@/api/analysis.api";

vi.mock("@/api/analysis.api", () => ({
  invokeAudioAnalysis: vi.fn(),
  invokeLyricsTranscription: vi.fn(),
}));

import { analyzeAudioAction, transcribeAudioLyrics } from "@/services/audio-reference/audio-analysis.service";

describe("audio-reference/audio-analysis.service", () => {
  describe("analyzeAudioAction", () => {
    it("calls invokeAudioAnalysis with default analysisType", async () => {
      vi.mocked(analysisApi.invokeAudioAnalysis).mockResolvedValue({
        data: { parsed: { genre: "rock" } },
        error: null,
      } as never);

      const result = await analyzeAudioAction({ publicUrl: "https://cdn.example.com/a.wav" });

      expect(analysisApi.invokeAudioAnalysis).toHaveBeenCalledWith({
        audioUrl: "https://cdn.example.com/a.wav",
        analysisType: "reference",
      });
      expect(result.data?.parsed?.genre).toBe("rock");
    });

    it("passes explicit analysisType", async () => {
      vi.mocked(analysisApi.invokeAudioAnalysis).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      await analyzeAudioAction({ publicUrl: "https://cdn.example.com/a.wav", analysisType: "full" });

      expect(analysisApi.invokeAudioAnalysis).toHaveBeenCalledWith({
        audioUrl: "https://cdn.example.com/a.wav",
        analysisType: "full",
      });
    });

    it("forwards edge function error", async () => {
      vi.mocked(analysisApi.invokeAudioAnalysis).mockResolvedValue({
        data: null,
        error: new Error("Analysis failed"),
      });

      const result = await analyzeAudioAction({ publicUrl: "https://cdn.example.com/a.wav" });

      expect(result.error?.message).toBe("Analysis failed");
    });
  });

  describe("transcribeAudioLyrics", () => {
    it("calls invokeLyricsTranscription with audioUrl", async () => {
      vi.mocked(analysisApi.invokeLyricsTranscription).mockResolvedValue({
        data: { has_vocals: true, lyrics: "hello" },
        error: null,
      } as never);

      const result = await transcribeAudioLyrics({ publicUrl: "https://cdn.example.com/vocal.wav" });

      expect(analysisApi.invokeLyricsTranscription).toHaveBeenCalledWith({
        audioUrl: "https://cdn.example.com/vocal.wav",
      });
      expect(result.data?.lyrics).toBe("hello");
      expect(result.data?.has_vocals).toBe(true);
    });

    it("forwards error", async () => {
      vi.mocked(analysisApi.invokeLyricsTranscription).mockResolvedValue({
        data: null,
        error: new Error("Transcription failed"),
      });

      const result = await transcribeAudioLyrics({ publicUrl: "https://cdn.example.com/vocal.wav" });

      expect(result.error?.message).toBe("Transcription failed");
    });
  });
});
