/**
 * Unit tests for studio/studio-realtime.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as studioApi from "@/api/studio.api";

vi.mock("@/api/studio.api", () => ({
  invokeSendTelegramNotification: vi.fn(),
  invokeAnalyzeTrackContext: vi.fn(),
  invokeMusicgenGenerate: vi.fn(),
  fetchSectionReplacementsHistory: vi.fn(),
  fetchReplacementTasks: vi.fn(),
  subscribeToReplacementTasks: vi.fn(),
  subscribeToPendingTaskComplete: vi.fn(),
  subscribeToStudioProject: vi.fn(),
  subscribeToGenerationTaskBySunoId: vi.fn(),
  fetchGenerationTaskBySunoId: vi.fn(),
  fetchTrackStemsMinimal: vi.fn(),
  subscribeToTrackStemsInsert: vi.fn(),
  fetchTrackStems: vi.fn(),
  fetchLatestStemTranscriptionByStemId: vi.fn(),
  fetchLatestStemTranscriptionByTrackId: vi.fn(),
  invokeReplicateMidiTranscription: vi.fn(),
  invokeKlangioAnalyze: vi.fn(),
}));

import {
  sendTelegramDocumentShare,
  analyzeTrackContext,
  generateInstrumental,
  fetchSectionReplacementsHistory,
  fetchReplacementTasksForTrack,
  subscribeToReplacementTasks,
  subscribeToPendingTaskComplete,
  subscribeToStudioProject,
  subscribeToGenerationTaskBySunoId,
  fetchGenerationTaskBySunoId,
  fetchTrackStemsMinimal,
  subscribeToTrackStemsInsert,
  fetchTrackStems,
  fetchLatestStemTranscriptionByStemId,
  fetchLatestStemTranscriptionByTrackId,
  invokeReplicateMidiTranscription,
  invokeKlangioAnalyze,
} from "@/services/studio/studio-realtime.service";

describe("studio/studio-realtime.service", () => {
  describe("sendTelegramDocumentShare", () => {
    it("returns error null on success", async () => {
      vi.mocked(studioApi.invokeSendTelegramNotification).mockResolvedValue({ data: null, error: null });
      const result = await sendTelegramDocumentShare({
        chat_id: "123",
        document_url: "https://cdn.example.com/doc.pdf",
        document_type: "pdf",
        filename: "doc.pdf",
      });
      expect(result.error).toBeNull();
    });

    it("returns error on api error", async () => {
      vi.mocked(studioApi.invokeSendTelegramNotification).mockResolvedValue({
        data: null,
        error: new Error("send failed"),
      });
      const result = await sendTelegramDocumentShare({
        chat_id: "123",
        document_url: "https://cdn.example.com/doc.pdf",
        document_type: "pdf",
        filename: "doc.pdf",
      });
      expect(result.error?.message).toBe("send failed");
    });
  });

  describe("analyzeTrackContext", () => {
    it("throws on error", async () => {
      vi.mocked(studioApi.invokeAnalyzeTrackContext).mockResolvedValue({
        data: null,
        error: new Error("analysis failed"),
      });
      await expect(analyzeTrackContext("https://cdn.example.com/a.mp3")).rejects.toThrow("analysis failed");
    });

    it("returns data on success", async () => {
      vi.mocked(studioApi.invokeAnalyzeTrackContext).mockResolvedValue({ data: { genre: "pop" }, error: null });
      const result = await analyzeTrackContext("https://cdn.example.com/a.mp3");
      expect(result).toEqual({ genre: "pop" });
    });
  });

  describe("generateInstrumental", () => {
    it("throws on error", async () => {
      vi.mocked(studioApi.invokeMusicgenGenerate).mockResolvedValue({ data: null, error: new Error("gen failed") });
      await expect(generateInstrumental({ prompt: "piano", duration: 30 })).rejects.toThrow("gen failed");
    });

    it("returns result on success", async () => {
      vi.mocked(studioApi.invokeMusicgenGenerate).mockResolvedValue({
        data: { audioUrl: "https://cdn.example.com/inst.mp3" },
        error: null,
      });
      const result = await generateInstrumental({ prompt: "piano", duration: 30 });
      expect(result.audioUrl).toBe("https://cdn.example.com/inst.mp3");
    });

    it("defaults model to melody", async () => {
      vi.mocked(studioApi.invokeMusicgenGenerate).mockResolvedValue({ data: {}, error: null });
      await generateInstrumental({ prompt: "piano", duration: 30 });
      expect(studioApi.invokeMusicgenGenerate).toHaveBeenCalledWith({ prompt: "piano", duration: 30, model: "melody" });
    });
  });

  describe("fetchSectionReplacementsHistory", () => {
    it("maps rows with metadata", async () => {
      const rows = [
        { id: "r1", created_at: "2026-07-01T10:00:00Z", version_id: "v1", metadata: { start: 10, end: 20 } },
        { id: "r2", created_at: "2026-07-02T10:00:00Z", version_id: null, metadata: {} },
      ] as never[];
      vi.mocked(studioApi.fetchSectionReplacementsHistory).mockResolvedValue(rows);

      const result = await fetchSectionReplacementsHistory("t1");

      expect(result).toHaveLength(2);
      expect(result[0].startTime).toBe(10);
      expect(result[0].endTime).toBe(20);
      expect(result[0].versionId).toBe("v1");
      expect(result[1].startTime).toBe(0);
      expect(result[1].versionId).toBeUndefined();
    });
  });

  describe("fetchReplacementTasksForTrack", () => {
    it("maps tasks", async () => {
      vi.mocked(studioApi.fetchReplacementTasks).mockResolvedValue([
        { id: "task1", status: "completed", created_at: "2026-07-01T10:00:00Z", error_message: null },
        { id: "task2", status: "failed", created_at: "2026-07-01T11:00:00Z", error_message: "error" },
      ] as never);

      const result = await fetchReplacementTasksForTrack("t1");

      expect(result[0].status).toBe("completed");
      expect(result[1].error_message).toBe("error");
    });
  });

  describe("subscribeToReplacementTasks", () => {
    it("wraps api subscription", () => {
      const unsubscribe = vi.fn();
      vi.mocked(studioApi.subscribeToReplacementTasks).mockReturnValue({ unsubscribe } as never);

      const cb = vi.fn();
      const sub = subscribeToReplacementTasks("t1", cb);
      sub.unsubscribe();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe("subscribeToPendingTaskComplete", () => {
    it("delegates to api", () => {
      const result = { unsubscribe: vi.fn() };
      vi.mocked(studioApi.subscribeToPendingTaskComplete).mockReturnValue(result);
      const cb = vi.fn();

      const sub = subscribeToPendingTaskComplete("suno-task-1", cb);

      expect(studioApi.subscribeToPendingTaskComplete).toHaveBeenCalledWith("suno-task-1", cb);
      expect(sub.unsubscribe).toBeDefined();
    });
  });

  describe("subscribeToStudioProject", () => {
    it("delegates to api", () => {
      vi.mocked(studioApi.subscribeToStudioProject).mockReturnValue({ unsubscribe: vi.fn() });
      const sub = subscribeToStudioProject("proj-1", vi.fn());
      expect(sub.unsubscribe).toBeDefined();
    });
  });

  describe("subscribeToGenerationTaskBySunoId", () => {
    it("delegates to api", () => {
      vi.mocked(studioApi.subscribeToGenerationTaskBySunoId).mockReturnValue({ unsubscribe: vi.fn() });
      const sub = subscribeToGenerationTaskBySunoId("suno-1", vi.fn());
      expect(sub.unsubscribe).toBeDefined();
    });
  });

  describe("fetchGenerationTaskBySunoId", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.fetchGenerationTaskBySunoId).mockResolvedValue({
        data: { status: "completed" },
        error: null,
      } as never);
      const result = await fetchGenerationTaskBySunoId("suno-1");
      expect(result.data?.status).toBe("completed");
    });
  });

  describe("fetchTrackStemsMinimal", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.fetchTrackStemsMinimal).mockResolvedValue([
        { stem_type: "vocals", audio_url: "https://cdn.example.com/v.mp3" },
      ]);
      const result = await fetchTrackStemsMinimal("t1");
      expect(result[0].stem_type).toBe("vocals");
    });
  });

  describe("subscribeToTrackStemsInsert", () => {
    it("delegates to api", () => {
      vi.mocked(studioApi.subscribeToTrackStemsInsert).mockReturnValue({ unsubscribe: vi.fn() });
      const sub = subscribeToTrackStemsInsert("t1", vi.fn());
      expect(sub.unsubscribe).toBeDefined();
    });
  });

  describe("fetchTrackStems", () => {
    it("returns stems on success", async () => {
      vi.mocked(studioApi.fetchTrackStems).mockResolvedValue({
        data: [{ id: "s1", stem_type: "vocals" }],
        error: null,
      });
      const result = await fetchTrackStems("t1");
      expect(result).toHaveLength(1);
    });

    it("returns empty on error", async () => {
      vi.mocked(studioApi.fetchTrackStems).mockResolvedValue({ data: null, error: new Error("fail") });
      expect(await fetchTrackStems("t1")).toEqual([]);
    });
  });

  describe("fetchLatestStemTranscriptionByStemId", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.fetchLatestStemTranscriptionByStemId).mockResolvedValue({ bpm: 120 });
      expect(await fetchLatestStemTranscriptionByStemId("s1")).toEqual({ bpm: 120 });
    });
  });

  describe("fetchLatestStemTranscriptionByTrackId", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.fetchLatestStemTranscriptionByTrackId).mockResolvedValue({ bpm: 130 });
      expect(await fetchLatestStemTranscriptionByTrackId("t1")).toEqual({ bpm: 130 });
    });
  });

  describe("invokeReplicateMidiTranscription", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.invokeReplicateMidiTranscription).mockResolvedValue({
        data: { midi_url: "https://cdn.example.com/midi.mid" },
        error: null,
      });
      const result = await invokeReplicateMidiTranscription({
        audio_url: "https://cdn.example.com/a.mp3",
        model_type: "basic-pitch",
        track_name: "test",
      });
      expect(result.data?.midi_url).toBe("https://cdn.example.com/midi.mid");
    });
  });

  describe("invokeKlangioAnalyze", () => {
    it("delegates to api", async () => {
      vi.mocked(studioApi.invokeKlangioAnalyze).mockResolvedValue({ data: { notes: [] }, error: null });
      const result = await invokeKlangioAnalyze({
        audio_url: "https://cdn.example.com/a.mp3",
        transcription_type: "auto",
        track_name: "test",
      });
      expect(result.data?.notes).toEqual([]);
    });
  });
});
