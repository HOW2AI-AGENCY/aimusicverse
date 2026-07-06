/**
 * Unit tests for studio/studio-generation.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchGenerationTask,
  fetchGenerationTaskBySunoId,
  invokeReplaceSection,
  fetchReplacedSectionTasks,
  fetchSectionReplacementLogs,
  fetchSectionReplacementsHistory,
  logTrackActivity,
  insertTrackChangeLog,
  invokeMergeStems,
  invokeSunoExtend,
  invokeSunoMusicExtend,
  invokeGenerateSfx,
  invokeAnalyzeTrackContext,
  invokeMusicgenGenerate,
  invokeSunoRemix,
  invokeAddInstrumental,
  invokeAddVocals,
  invokeSunoMashup,
  invokeSunoPersona,
  invokeSunoFileUpload,
  invokeSendTelegramNotification,
} from "@/api/studio/studio-generation.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

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

describe("studio-generation.api", () => {
  describe("fetchGenerationTask", () => {
    it("fetches task by ID", async () => {
      const task = { id: "gt1", status: "completed" };
      mockFrom.mockReturnValue(chainMock({ data: task, error: null }));
      const res = await fetchGenerationTask("gt1");
      expect(res.data).toEqual(task);
    });
  });

  describe("fetchGenerationTaskBySunoId", () => {
    it("fetches task by suno_task_id", async () => {
      const task = { status: "completed", received_clips: 2, expected_clips: 2 };
      mockFrom.mockReturnValue(chainMock({ data: task, error: null }));
      const res = await fetchGenerationTaskBySunoId("st1");
      expect(res.data).toEqual(task);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchGenerationTaskBySunoId("st1");
      expect(res.data).toBeNull();
    });
  });

  describe("invokeReplaceSection", () => {
    it("invokes suno-replace-section", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });
      const res = await invokeReplaceSection({
        trackId: "t1",
        userId: "u1",
        taskId: "gt1",
        audioId: "a1",
        startTime: 10,
        endTime: 20,
        prompt: "guitar solo",
      });
      expect(res.data?.success).toBe(true);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-replace-section", expect.any(Object));
    });
  });

  describe("fetchReplacedSectionTasks", () => {
    it("fetches replaced section tasks", async () => {
      const tasks = [{ id: "gt1", status: "completed" }];
      mockFrom.mockReturnValue(chainMock({ data: tasks, error: null }));
      const res = await fetchReplacedSectionTasks("t1");
      expect(res.data).toEqual(tasks);
    });
  });

  describe("fetchSectionReplacementLogs", () => {
    it("fetches started and completed logs", async () => {
      const startedChain = chainMock({ data: [{ id: "log1" }], error: null });
      const completedChain = chainMock({ data: [{ id: "log2" }], error: null });
      mockFrom.mockReturnValueOnce(startedChain).mockReturnValueOnce(completedChain);
      const res = await fetchSectionReplacementLogs("t1");
      expect(res.startedLogs).toEqual([{ id: "log1" }]);
      expect(res.completedLogs).toEqual([{ id: "log2" }]);
      expect(res.error).toBeNull();
    });
  });

  describe("fetchSectionReplacementsHistory", () => {
    it("fetches history", async () => {
      const logs = [{ id: "log1", change_type: "section_replacement" }];
      mockFrom.mockReturnValue(chainMock({ data: logs, error: null }));
      const res = await fetchSectionReplacementsHistory("t1");
      expect(res).toEqual(logs);
    });

    it("returns empty array on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      const res = await fetchSectionReplacementsHistory("t1");
      expect(res).toEqual([]);
    });
  });

  describe("logTrackActivity", () => {
    it("inserts log entry", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await logTrackActivity({
        trackId: "t1",
        userId: "u1",
        changeType: "edit",
        changedBy: "user",
      });
      expect(res.error).toBeNull();
    });
  });

  describe("insertTrackChangeLog", () => {
    it("inserts change log", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(
        insertTrackChangeLog({
          trackId: "t1",
          userId: "u1",
          changeType: "edit",
          changedBy: "user",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert fail" } }));
      await expect(
        insertTrackChangeLog({
          trackId: "t1",
          userId: "u1",
          changeType: "edit",
          changedBy: "user",
        }),
      ).rejects.toThrow("insert fail");
    });
  });

  describe("invokeMergeStems", () => {
    it("invokes merge-stems", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { mergedUrl: "merged.mp3" }, error: null });
      const res = await invokeMergeStems({ trackId: "t1" });
      expect(res.data?.mergedUrl).toBe("merged.mp3");
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "merge failed" } });
      const res = await invokeMergeStems({ trackId: "t1" });
      expect(res.error?.message).toBe("merge failed");
    });
  });

  // Edge function wrappers — all follow the same invoke pattern
  describe("edge function wrappers", () => {
    const edgeTests = [
      { fn: invokeSunoExtend, name: "suno-extend", payload: { audioId: "a1", prompt: "p", continueAt: 30 } },
      { fn: invokeSunoMusicExtend, name: "suno-music-extend", payload: { sourceTrackId: "t1" } },
      { fn: invokeGenerateSfx, name: "generate-sfx", payload: { prompt: "boom", duration: 2 } },
      { fn: invokeAnalyzeTrackContext, name: "analyze-track-context", payload: { audioUrl: "a.mp3" } },
      { fn: invokeMusicgenGenerate, name: "musicgen-generate", payload: { prompt: "beat", duration: 10 } },
      {
        fn: invokeSunoRemix,
        name: "suno-remix",
        payload: { audioId: "a1", prompt: "p", style: "rock", title: "T", instrumental: false },
      },
      { fn: invokeAddInstrumental, name: "suno-add-instrumental", payload: { style: "rock" } },
      { fn: invokeAddVocals, name: "suno-add-vocals", payload: { track_id: "t1" } },
      { fn: invokeSunoMashup, name: "suno-mashup", payload: { trackAId: "t1", trackBId: "t2", customMode: false } },
      { fn: invokeSunoPersona, name: "suno-persona", payload: { trackId: "t1", name: "Persona" } },
      {
        fn: invokeSunoFileUpload,
        name: "suno-file-upload",
        payload: { action: "url" as const, fileUrl: "https://file.mp3" },
      },
      {
        fn: invokeSendTelegramNotification,
        name: "send-telegram-notification",
        payload: { type: "video_share", chat_id: "123" },
      },
    ];

    for (const { fn, name, payload } of edgeTests) {
      it(`${name} invokes edge function and returns data`, async () => {
        const result = { success: true, taskId: "task-1" };
        mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
        const res = await (fn as (p: unknown) => Promise<{ data: unknown; error: unknown }>)(payload);
        expect(res.data).toEqual(result);
        expect(res.error).toBeNull();
        expect(mockFunctions.invoke).toHaveBeenCalledWith(name, { body: payload });
      });

      it(`${name} returns error on failure`, async () => {
        mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: `${name} failed` } });
        const res = await (fn as (p: unknown) => Promise<{ data: unknown; error: unknown }>)(payload);
        expect(res.error).toBeTruthy();
      });
    }
  });
});
