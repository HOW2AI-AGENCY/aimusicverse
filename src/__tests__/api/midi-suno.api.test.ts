/**
 * Unit tests for midi-suno.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { generateSunoMidi, getSunoMidiStatus } from "@/api/midi-suno.api";

const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe("midi-suno.api", () => {
  describe("generateSunoMidi", () => {
    it("invokes suno-midi and returns taskId", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, taskId: "midi-task-1" }, error: null });
      const res = await generateSunoMidi({ trackVersionId: "v1", userId: "u1" });
      expect(res.taskId).toBe("midi-task-1");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-midi", {
        body: { trackVersionId: "v1", userId: "u1" },
      });
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "midi failed" } });
      await expect(generateSunoMidi({ trackVersionId: "v1", userId: "u1" })).rejects.toThrow("midi failed");
    });

    it("throws when no taskId returned", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });
      await expect(generateSunoMidi({ trackVersionId: "v1", userId: "u1" })).rejects.toThrow(
        "suno-midi returned no taskId",
      );
    });
  });

  describe("getSunoMidiStatus", () => {
    it("returns status on success", async () => {
      const status = { success: true, taskId: "t1", status: "SUCCESS" as const, midiUrl: "midi.mid", notesCount: 120 };
      mockFunctions.invoke.mockResolvedValue({ data: status, error: null });
      const res = await getSunoMidiStatus("t1");
      expect(res.status).toBe("SUCCESS");
      expect(res.midiUrl).toBe("midi.mid");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-midi-details", { body: { taskId: "t1" } });
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "details failed" } });
      await expect(getSunoMidiStatus("t1")).rejects.toThrow("details failed");
    });

    it("returns fallback when no data", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      const res = await getSunoMidiStatus("t1");
      expect(res.success).toBe(false);
      expect(res.status).toBe("PROCESSING");
      expect(res.error).toBe("no data");
    });
  });
});
