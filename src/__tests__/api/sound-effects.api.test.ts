/**
 * Unit tests for sound-effects.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { generateSunoSounds, getSunoSoundsStatus } from "@/api/sound-effects.api";

const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe("sound-effects.api", () => {
  describe("generateSunoSounds", () => {
    it("invokes suno-sounds and returns taskId", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, taskId: "task-123" }, error: null });
      const res = await generateSunoSounds({ prompt: "explosion", userId: "u1" });
      expect(res.taskId).toBe("task-123");
      expect(res.success).toBe(true);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-sounds", {
        body: { prompt: "explosion", userId: "u1" },
      });
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "suno failed" } });
      await expect(generateSunoSounds({ prompt: "boom", userId: "u1" })).rejects.toThrow("suno failed");
    });

    it("throws when no taskId returned", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });
      await expect(generateSunoSounds({ prompt: "boom", userId: "u1" })).rejects.toThrow(
        "suno-sounds returned no taskId",
      );
    });

    it("passes optional parameters", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, taskId: "t1" }, error: null });
      await generateSunoSounds({ prompt: "rain", userId: "u1", model: "V5", tempo: 120, key: "C", duration: 10 });
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-sounds", {
        body: expect.objectContaining({ model: "V5", tempo: 120, key: "C", duration: 10 }),
      });
    });
  });

  describe("getSunoSoundsStatus", () => {
    it("returns status on success", async () => {
      const status = { success: true, status: "completed" as const, audio_url: "sfx.mp3" };
      mockFunctions.invoke.mockResolvedValue({ data: status, error: null });
      const res = await getSunoSoundsStatus("task-123");
      expect(res.status).toBe("completed");
      expect(res.audio_url).toBe("sfx.mp3");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-sounds-status", { body: { taskId: "task-123" } });
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "status failed" } });
      await expect(getSunoSoundsStatus("task-123")).rejects.toThrow("status failed");
    });

    it("returns fallback when no data", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      const res = await getSunoSoundsStatus("task-123");
      expect(res.success).toBe(false);
      expect(res.status).toBe("processing");
      expect(res.error).toBe("no data");
    });
  });
});
