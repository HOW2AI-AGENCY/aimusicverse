/**
 * Unit tests for audio-reference/cloud-audio.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { listReferenceAudioForUser } from "@/api/recordings.api";

vi.mock("@/api/recordings.api", () => ({
  listReferenceAudioForUser: vi.fn(),
}));

const functionsInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

import {
  listCloudAudio,
  invokeAnalyzeAudio,
  invokeTranscribeLyrics,
} from "@/services/audio-reference/cloud-audio.service";

describe("audio-reference/cloud-audio.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCloudAudio", () => {
    it("delegates to listReferenceAudioForUser", async () => {
      const rows = [
        { id: "ref1", audio_url: "https://cdn.example.com/1.wav", user_id: "uid" },
        { id: "ref2", audio_url: "https://cdn.example.com/2.wav", user_id: "uid" },
      ];
      vi.mocked(listReferenceAudioForUser).mockResolvedValue(rows as never);

      const result = await listCloudAudio("uid", 50);

      expect(result).toEqual(rows);
      expect(listReferenceAudioForUser).toHaveBeenCalledWith("uid", 50);
    });

    it("returns empty array when no audio references", async () => {
      vi.mocked(listReferenceAudioForUser).mockResolvedValue([]);

      const result = await listCloudAudio("uid");

      expect(result).toEqual([]);
    });
  });

  describe("invokeAnalyzeAudio", () => {
    it("calls analyze-audio-flamingo edge function", async () => {
      functionsInvoke.mockResolvedValue({
        data: { parsed: { genre: "rock", mood: "energetic" } },
        error: null,
      });

      const result = await invokeAnalyzeAudio({
        audioUrl: "https://cdn.example.com/audio.wav",
        referenceId: "ref1",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("analyze-audio-flamingo", {
        body: { audio_url: "https://cdn.example.com/audio.wav", reference_id: "ref1" },
      });
      expect(result.data?.parsed).toEqual({ genre: "rock", mood: "energetic" });
    });

    it("forwards error from edge function", async () => {
      functionsInvoke.mockResolvedValue({ data: null, error: { message: "Analysis failed" } });

      const result = await invokeAnalyzeAudio({ audioUrl: "https://cdn.example.com/audio.wav", referenceId: "ref1" });

      expect(result.error?.message).toBe("Analysis failed");
    });
  });

  describe("invokeTranscribeLyrics", () => {
    it("calls transcribe-lyrics edge function", async () => {
      functionsInvoke.mockResolvedValue({
        data: { transcription: "hello world" },
        error: null,
      });

      const result = await invokeTranscribeLyrics({
        audioUrl: "https://cdn.example.com/vocals.wav",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("transcribe-lyrics", {
        body: { audio_url: "https://cdn.example.com/vocals.wav" },
      });
      expect(result.data?.transcription).toBe("hello world");
    });

    it("forwards error from edge function", async () => {
      functionsInvoke.mockResolvedValue({ data: null, error: { message: "Transcription failed" } });

      const result = await invokeTranscribeLyrics({ audioUrl: "https://cdn.example.com/vocals.wav" });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Transcription failed");
    });
  });
});
