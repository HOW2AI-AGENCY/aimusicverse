/**
 * Unit tests for audio-reference/generation.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

const functionsInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

import {
  invokeAddVocalsToReference,
  invokeProcessRecordedAudio,
  invokeAddVocalsToGuitar,
  invokeExtractLyricsFromStem,
  invokeTranscribeMidi,
} from "@/services/audio-reference/generation.service";

describe("audio-reference/generation.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invokeAddVocalsToReference", () => {
    it("calls suno-add-vocals for add_vocals mode", async () => {
      functionsInvoke.mockResolvedValue({ data: { taskId: "t1" }, error: null });

      const result = await invokeAddVocalsToReference("add_vocals", {
        audioUrl: "https://cdn.example.com/audio.wav",
        prompt: "pop",
        customMode: true,
        style: "pop",
        title: "My Track",
        negativeTags: "",
        referenceAudioId: "ref1",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("suno-add-vocals", {
        body: expect.objectContaining({ audioUrl: "https://cdn.example.com/audio.wav", prompt: "pop" }),
      });
      expect(result.data).toEqual({ taskId: "t1" });
    });

    it("calls suno-add-instrumental for add_instrumental mode", async () => {
      functionsInvoke.mockResolvedValue({ data: null, error: null });

      await invokeAddVocalsToReference("add_instrumental", {
        audioUrl: "https://cdn.example.com/audio.wav",
        prompt: "jazz",
        customMode: false,
        style: "jazz",
        title: "Inst Track",
        negativeTags: "",
        referenceAudioId: "ref2",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("suno-add-instrumental", expect.anything());
    });
  });

  describe("invokeProcessRecordedAudio", () => {
    it("builds full payload for instrumental mode", async () => {
      functionsInvoke.mockResolvedValue({ data: { taskId: "t1" }, error: null });

      const result = await invokeProcessRecordedAudio({
        action: "instrumental",
        audioUrl: "https://cdn.example.com/record.wav",
        title: "Guitar Track",
        prompt: "soft rock",
        style: "soft rock",
        negativeTags: "",
        genre: "rock",
        mood: "calm",
        bpm: 80,
      });

      expect(functionsInvoke).toHaveBeenCalledWith("suno-add-instrumental", {
        body: expect.objectContaining({
          audioUrl: "https://cdn.example.com/record.wav",
          model: "V4_5PLUS",
          audioWeight: 0.8,
          styleWeight: 0.55,
        }),
      });
      expect(result.data).toEqual({ taskId: "t1" });
    });

    it("forwards error from edge function", async () => {
      functionsInvoke.mockResolvedValue({ data: null, error: { message: "edge failure" } });

      const result = await invokeProcessRecordedAudio({
        action: "vocals",
        audioUrl: "https://cdn.example.com/record.wav",
        title: "Vocals",
        prompt: "pop",
        style: "pop",
        negativeTags: "",
      });

      expect(result.error?.message).toBe("edge failure");
    });
  });

  describe("invokeAddVocalsToGuitar", () => {
    it("calls suno-add-vocals with guitar payload", async () => {
      functionsInvoke.mockResolvedValue({ data: { taskId: "t1" }, error: null });

      const result = await invokeAddVocalsToGuitar({
        audioUrl: "https://cdn.example.com/guitar.wav",
        prompt: "folk",
        customMode: true,
        style: "folk",
        title: "Guitar Vocals",
        negativeTags: "",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("suno-add-vocals", {
        body: expect.objectContaining({ audioUrl: "https://cdn.example.com/guitar.wav" }),
      });
      expect(result.data).toEqual({ taskId: "t1" });
    });
  });

  describe("invokeExtractLyricsFromStem", () => {
    it("calls extract-lyrics-from-stem with correct params", async () => {
      functionsInvoke.mockResolvedValue({ data: { lyrics: "hello world" }, error: null });

      const result = await invokeExtractLyricsFromStem({
        referenceId: "ref1",
        vocalStemUrl: "https://cdn.example.com/vocals.wav",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("extract-lyrics-from-stem", {
        body: { reference_id: "ref1", vocal_stem_url: "https://cdn.example.com/vocals.wav" },
      });
      expect(result.data).toEqual({ lyrics: "hello world" });
    });
  });

  describe("invokeTranscribeMidi", () => {
    it("calls transcribe-midi with full payload", async () => {
      functionsInvoke.mockResolvedValue({ data: { midi_url: "https://cdn.example.com/out.mid" }, error: null });

      const result = await invokeTranscribeMidi({
        audioUrl: "https://cdn.example.com/stem.wav",
        userId: "uid",
        model: "basic-pitch",
        outputFormats: ["midi", "musicxml"],
        referenceId: "ref1",
        stemType: "vocals",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("transcribe-midi", {
        body: {
          audio_url: "https://cdn.example.com/stem.wav",
          user_id: "uid",
          model: "basic-pitch",
          output_formats: ["midi", "musicxml"],
          reference_id: "ref1",
          stem_type: "vocals",
        },
      });
      expect(result.data?.midi_url).toBe("https://cdn.example.com/out.mid");
    });
  });
});
