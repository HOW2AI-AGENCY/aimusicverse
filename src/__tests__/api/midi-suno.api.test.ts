/**
 * Unit tests for midi-suno.api.ts
 * Sprint 053-A3 — Suno MIDI API coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { generateSunoMidi, getSunoMidiStatus } from "@/api/midi-suno.api";
import type { SunoMidiAccepted, SunoMidiStatus } from "@/api/midi-suno.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

describe("generateSunoMidi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept taskId and userId, return accepted response with taskId", async () => {
    const expected: SunoMidiAccepted = { success: true, taskId: "midi-task-123" };
    mockFunctions.invoke.mockResolvedValue({ data: expected, error: null });

    const result = await generateSunoMidi({ taskId: "sep-task-001", userId: "user-001" });

    expect(result).toEqual(expected);
    expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-midi", {
      body: { taskId: "sep-task-001", userId: "user-001" },
    });
  });

  it("should accept optional audioId for specific stem", async () => {
    const expected: SunoMidiAccepted = { success: true, taskId: "midi-task-456" };
    mockFunctions.invoke.mockResolvedValue({ data: expected, error: null });

    const result = await generateSunoMidi({
      taskId: "sep-task-001",
      audioId: "stem-audio-id-xyz",
      userId: "user-001",
    });

    expect(result).toEqual(expected);
    expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-midi", {
      body: { taskId: "sep-task-001", audioId: "stem-audio-id-xyz", userId: "user-001" },
    });
  });

  it("should throw on edge function error", async () => {
    mockFunctions.invoke.mockResolvedValue({ data: null, error: new Error("Network failure") });

    await expect(generateSunoMidi({ taskId: "sep-task-001", userId: "user-001" })).rejects.toThrow(
      "Network failure",
    );
  });

  it("should throw when edge returns no taskId", async () => {
    mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });

    await expect(generateSunoMidi({ taskId: "sep-task-001", userId: "user-001" })).rejects.toThrow(
      "suno-midi returned no taskId",
    );
  });
});

describe("getSunoMidiStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return midi status with URL on success", async () => {
    const expected: SunoMidiStatus = {
      success: true,
      taskId: "midi-task-123",
      status: "SUCCESS",
      midiUrl: "https://storage.example.com/song.mid",
      notesCount: 420,
      duration: 180,
    };
    mockFunctions.invoke.mockResolvedValue({ data: expected, error: null });

    const result = await getSunoMidiStatus("midi-task-123");

    expect(result).toEqual(expected);
    expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-midi-details", {
      body: { taskId: "midi-task-123" },
    });
  });

  it("should return PROCESSING status when task is still running", async () => {
    const processing: SunoMidiStatus = {
      success: true,
      taskId: "midi-task-123",
      status: "PROCESSING",
    };
    mockFunctions.invoke.mockResolvedValue({ data: processing, error: null });

    const result = await getSunoMidiStatus("midi-task-123");

    expect(result.status).toBe("PROCESSING");
    expect(result.midiUrl).toBeUndefined();
  });

  it("should throw on network error", async () => {
    mockFunctions.invoke.mockResolvedValue({ data: null, error: new Error("API unreachable") });

    await expect(getSunoMidiStatus("midi-task-123")).rejects.toThrow("API unreachable");
  });

  it("should return fallback when data is null", async () => {
    mockFunctions.invoke.mockResolvedValue({ data: null, error: null });

    const result = await getSunoMidiStatus("midi-task-123");

    expect(result.success).toBe(false);
    expect(result.status).toBe("PROCESSING");
    expect(result.error).toBe("no data");
  });
});
