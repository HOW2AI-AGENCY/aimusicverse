/**
 * Unit tests for studio/studio-operations.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as studioApi from "@/api/studio.api";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/api/studio.api", () => ({
  setPrimaryVersion: vi.fn(),
  logTrackActivity: vi.fn(),
  invokeSunoExtend: vi.fn(),
  invokeSunoMusicExtend: vi.fn(),
  invokeGenerateSfx: vi.fn(),
  invokeAddInstrumental: vi.fn(),
  invokeAddVocals: vi.fn(),
  invokeSunoUploadCover: vi.fn(),
  invokeSunoUploadExtend: vi.fn(),
  invokeSunoMashup: vi.fn(),
  invokeSunoPersona: vi.fn(),
  invokeSunoFileUpload: vi.fn(),
}));

import {
  switchToVersion,
  logStudioActivity,
  extendTrack,
  extendMusic,
  generateSfx,
  addInstrumental,
  addVocals,
  sunoUploadCover,
  sunoUploadExtend,
  sunoMashup,
  sunoPersona,
  sunoFileUpload,
} from "@/services/studio/studio-operations.service";

describe("studio-operations.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("switchToVersion", () => {
    it("returns success on successful switch", async () => {
      vi.mocked(studioApi.setPrimaryVersion).mockResolvedValue({ error: null });

      const result = await switchToVersion("track-1", "version-a");

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(studioApi.setPrimaryVersion).toHaveBeenCalledWith("track-1", "version-a");
    });

    it("returns error on failure", async () => {
      vi.mocked(studioApi.setPrimaryVersion).mockResolvedValue({
        error: { message: "Version not found" },
      });

      const result = await switchToVersion("track-1", "version-b");

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Version not found");
    });
  });

  describe("logStudioActivity", () => {
    it("skips when no user", async () => {
      supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

      await logStudioActivity("track-1", "edit", { foo: "bar" });

      expect(studioApi.logTrackActivity).not.toHaveBeenCalled();
    });

    it("logs activity for authenticated user", async () => {
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      vi.mocked(studioApi.logTrackActivity).mockResolvedValue({ error: null });

      await logStudioActivity("track-1", "edit", { foo: "bar" });

      expect(studioApi.logTrackActivity).toHaveBeenCalledWith({
        trackId: "track-1",
        userId: "user-1",
        changeType: "edit",
        changedBy: "studio",
        metadata: { foo: "bar" },
      });
    });

    it("does not throw on error", async () => {
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      vi.mocked(studioApi.logTrackActivity).mockRejectedValue(new Error("fail"));

      await expect(logStudioActivity("track-1", "edit")).resolves.toBeUndefined();
    });
  });

  describe("extendTrack", () => {
    it("calls invokeSunoExtend with params", async () => {
      vi.mocked(studioApi.invokeSunoExtend).mockResolvedValue({ error: null });

      const result = await extendTrack({
        audioId: "audio-1",
        prompt: "continue",
        continueAt: 120,
        model: "chirp-v4",
      });

      expect(result.error).toBeNull();
      expect(studioApi.invokeSunoExtend).toHaveBeenCalledWith({
        audioId: "audio-1",
        prompt: "continue",
        continueAt: 120,
        model: "chirp-v4",
      });
    });

    it("returns error on failure", async () => {
      vi.mocked(studioApi.invokeSunoExtend).mockResolvedValue({
        error: { message: "extend failed" },
      });

      const result = await extendTrack({ audioId: "a1", prompt: "p", continueAt: 0 });

      expect(result.error?.message).toBe("extend failed");
    });
  });

  describe("extendMusic", () => {
    it("calls invokeSunoMusicExtend with full params", async () => {
      vi.mocked(studioApi.invokeSunoMusicExtend).mockResolvedValue({
        data: { taskId: "t1" },
        error: null,
      });

      const result = await extendMusic({
        sourceTrackId: "track-1",
        defaultParamFlag: true,
        continueAt: 120,
        prompt: "more",
        style: "pop",
        title: "Extended",
        model: "chirp-v4",
        negativeTags: "",
        vocalGender: "female",
        styleWeight: 0.5,
        weirdnessConstraint: 0.3,
        audioWeight: 0.5,
        projectId: "proj-1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ taskId: "t1" });
    });
  });

  describe("generateSfx", () => {
    it("calls invokeGenerateSfx and returns audioUrl", async () => {
      vi.mocked(studioApi.invokeGenerateSfx).mockResolvedValue({
        data: { success: true, audioUrl: "https://cdn.example.com/sfx.mp3" },
        error: null,
      });

      const url = await generateSfx({ prompt: "laser", duration: 5 });

      expect(url).toBe("https://cdn.example.com/sfx.mp3");
    });

    it("throws on error", async () => {
      vi.mocked(studioApi.invokeGenerateSfx).mockResolvedValue({
        data: { success: false, error: "fail" },
        error: null,
      });

      await expect(generateSfx({ prompt: "laser", duration: 5 })).rejects.toThrow();
    });
  });

  describe("addInstrumental", () => {
    it("calls invokeAddInstrumental with action type", async () => {
      vi.mocked(studioApi.invokeAddInstrumental).mockResolvedValue({
        data: { trackId: "t1", taskId: "task-1" },
        error: null,
      });

      const result = await addInstrumental({
        trackId: "track-1",
        style: "jazz",
        title: "Instrumental",
        negativeTags: "",
        audioWeight: 0.5,
        styleWeight: 0.5,
        weirdnessConstraint: 0.3,
        model: "chirp-v4",
      });

      expect(result.error).toBeNull();
      expect(result.trackId).toBe("t1");
      expect(result.taskId).toBe("task-1");
    });
  });

  describe("addVocals", () => {
    it("calls invokeAddVocals with action type", async () => {
      vi.mocked(studioApi.invokeAddVocals).mockResolvedValue({
        data: { trackId: "t1", taskId: "task-1" },
        error: null,
      });

      const result = await addVocals({
        trackId: "track-1",
        style: "pop",
        title: "Vocals",
        prompt: "sing",
        customMode: true,
        projectId: "proj-1",
        vocalGender: "female",
      });

      expect(result.error).toBeNull();
      expect(result.trackId).toBe("t1");
    });
  });

  describe("sunoUploadCover", () => {
    it("calls invokeSunoUploadCover", async () => {
      vi.mocked(studioApi.invokeSunoUploadCover).mockResolvedValue({
        data: { coverUrl: "https://cdn.example.com/cover.png" },
        error: null,
      });

      const result = await sunoUploadCover({
        audioFile: { name: "cover.wav", url: "https://cdn.example.com/temp.wav" },
        audioDuration: 180,
        model: "chirp-v4",
        instrumental: false,
        style: "pop",
        title: "Cover",
      });

      expect(result.error).toBeNull();
    });
  });

  describe("sunoUploadExtend", () => {
    it("calls invokeSunoUploadExtend with continueAt", async () => {
      vi.mocked(studioApi.invokeSunoUploadExtend).mockResolvedValue({
        data: { taskId: "t1" },
        error: null,
      });

      const result = await sunoUploadExtend({
        audioFile: { name: "ext.wav", url: "https://cdn.example.com/temp.wav" },
        audioDuration: 180,
        continueAt: 120,
        model: "chirp-v4",
      });

      expect(result.error).toBeNull();
    });
  });

  describe("sunoMashup", () => {
    it("calls invokeSunoMashup and returns taskId/trackId", async () => {
      vi.mocked(studioApi.invokeSunoMashup).mockResolvedValue({
        data: { taskId: "task-1", trackId: "track-1" },
        error: null,
      });

      const result = await sunoMashup({
        trackAId: "a",
        trackBId: "b",
        customMode: true,
        instrumental: false,
        prompt: "mix it",
        style: "pop",
        title: "Mashup",
        model: "chirp-v4",
      });

      expect(result.error).toBeNull();
      expect(result.data?.taskId).toBe("task-1");
      expect(result.data?.trackId).toBe("track-1");
    });

    it("returns error when no taskId returned", async () => {
      vi.mocked(studioApi.invokeSunoMashup).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await sunoMashup({ trackAId: "a", trackBId: "b", customMode: false });

      expect(result.error?.message).toBe("Mashup edge returned no taskId/trackId");
    });
  });

  describe("sunoPersona", () => {
    it("calls invokeSunoPersona and returns personaId", async () => {
      vi.mocked(studioApi.invokeSunoPersona).mockResolvedValue({
        data: { personaId: "p1", sunoTaskId: null, sunoPersonaId: null, status: "pending" },
        error: null,
      });

      const result = await sunoPersona({
        trackId: "track-1",
        name: "My Persona",
        description: "Warm voice",
        model: "chirp-v4",
      });

      expect(result.error).toBeNull();
      expect(result.data?.personaId).toBe("p1");
      expect(result.data?.status).toBe("pending");
    });

    it("returns error when no personaId", async () => {
      vi.mocked(studioApi.invokeSunoPersona).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await sunoPersona({ trackId: "track-1", name: "name" });

      expect(result.error?.message).toBe("Persona edge returned no personaId");
    });
  });

  describe("sunoFileUpload", () => {
    it("calls invokeSunoFileUpload and returns file_url", async () => {
      vi.mocked(studioApi.invokeSunoFileUpload).mockResolvedValue({
        data: { file_url: "https://cdn.example.com/uploaded.wav", expires_in_days: 7 },
        error: null,
      });

      const result = await sunoFileUpload({
        filename: "audio.wav",
        fileBase64: "YXVkaW8=",
        contentType: "audio/wav",
      });

      expect(result.error).toBeNull();
      expect(result.data?.file_url).toBe("https://cdn.example.com/uploaded.wav");
    });

    it("defaults contentType to audio/mpeg", async () => {
      vi.mocked(studioApi.invokeSunoFileUpload).mockResolvedValue({
        data: { file_url: "https://cdn.example.com/out.mp3", expires_in_days: 7 },
        error: null,
      });

      await sunoFileUpload({ filename: "audio.mp3", fileBase64: "YXVkaW8=" });

      expect(studioApi.invokeSunoFileUpload).toHaveBeenCalledWith({
        action: "base64",
        filename: "audio.mp3",
        fileBase64: "YXVkaW8=",
        contentType: "audio/mpeg",
      });
    });
  });
});
