/**
 * VoiceCloneService — Result<T,E> conversion tests.
 *
 * Validates that each public method returns `ok(value)` on success and
 * `err(VoiceCloneServiceError)` on failure (instead of throwing).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOk, isErr } from "@/lib/result";
import { VoiceCloneService, VoiceCloneServiceError } from "../VoiceCloneService";

const BASE_CONFIG = {
  apiKey: "test-key",
  baseUrl: "https://api.sunoapi.org",
  timeout: 5000,
  maxPollingAttempts: 60,
  pollingInterval: 3000,
};

/** Stub global.fetch with a JSON response and an HTTP status. */
function mockFetch(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  }));
}

describe("VoiceCloneService — Result<T,E> conversions", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("validateVoice", () => {
    it("returns ok(taskId) on success", async () => {
      globalThis.fetch = mockFetch(200, { validate_task_id: "task-123" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.validateVoice({
        voiceUrl: "https://example.com/voice.mp3",
        vocalStartS: 10,
        vocalEndS: 30,
      });

      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("task-123");
    });

    it("returns err(NO_TASK_ID) when API omits task id", async () => {
      globalThis.fetch = mockFetch(200, {});
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.validateVoice({
        voiceUrl: "https://example.com/voice.mp3",
        vocalStartS: 0,
        vocalEndS: 10,
      });

      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error).toBeInstanceOf(VoiceCloneServiceError);
        expect(r.error.code).toBe("NO_TASK_ID");
        expect(r.error.step).toBe("upload");
      }
    });

    it("returns err(API_ERROR) on non-2xx response", async () => {
      globalThis.fetch = mockFetch(500, { message: "boom" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.validateVoice({
        voiceUrl: "https://example.com/voice.mp3",
        vocalStartS: 0,
        vocalEndS: 10,
      });

      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("API_ERROR");
        expect(r.error.statusCode).toBe(500);
      }
    });
  });

  describe("getValidatePhrase", () => {
    it("returns ok(phrase) on success", async () => {
      globalThis.fetch = mockFetch(200, { status: "success", validate_phrase: "hello world" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getValidatePhrase("task-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("hello world");
    });

    it("returns ok(null) when still processing", async () => {
      globalThis.fetch = mockFetch(200, { status: "pending" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getValidatePhrase("task-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBeNull();
    });

    it("returns err(VALIDATION_FAILED) when API reports processing_validate_fail", async () => {
      globalThis.fetch = mockFetch(200, { status: "processing_validate_fail", error: "bad segment" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getValidatePhrase("task-1");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("VALIDATION_FAILED");
        expect(r.error.retryable).toBe(true);
      }
    });
  });

  describe("regeneratePhrase", () => {
    it("returns ok(newTaskId) on success", async () => {
      globalThis.fetch = mockFetch(200, { validate_task_id: "task-2" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.regeneratePhrase("task-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("task-2");
    });

    it("returns err when API fails", async () => {
      globalThis.fetch = mockFetch(400, { message: "bad request" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.regeneratePhrase("task-1");
      expect(isErr(r)).toBe(true);
    });
  });

  describe("pollValidateInfo", () => {
    it("returns err(POLLING_ABORTED) immediately when signal is aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.pollValidateInfo("task-1", {
        interval: 1,
        maxAttempts: 5,
        abortSignal: controller.signal,
      });

      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("POLLING_ABORTED");
    });

    it("returns err(POLLING_TIMEOUT) when max attempts reached", async () => {
      globalThis.fetch = mockFetch(200, { status: "pending" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.pollValidateInfo("task-1", { interval: 1, maxAttempts: 2 });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("POLLING_TIMEOUT");
    });

    it("returns ok(phrase) once API responds with a phrase", async () => {
      // First call returns pending, second returns phrase
      const calls = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ status: "pending" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ status: "success", validate_phrase: "got it" }),
        });
      globalThis.fetch = calls as unknown as typeof globalThis.fetch;

      const svc = new VoiceCloneService(BASE_CONFIG);
      const r = await svc.pollValidateInfo("task-1", { interval: 1, maxAttempts: 5 });

      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("got it");
    });
  });

  describe("generateVoice", () => {
    it("returns ok(taskId) on success", async () => {
      globalThis.fetch = mockFetch(200, { generate_task_id: "gen-1" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.generateVoice({
        taskId: "task-1",
        verifyUrl: "https://example.com/rec.mp3",
        callBackUrl: "https://example.com/cb",
      });
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("gen-1");
    });

    it("returns err(NO_TASK_ID) when missing", async () => {
      globalThis.fetch = mockFetch(200, {});
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.generateVoice({
        taskId: "task-1",
        verifyUrl: "https://example.com/rec.mp3",
        callBackUrl: "https://example.com/cb",
      });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("NO_TASK_ID");
    });
  });

  describe("getVoiceId", () => {
    it("returns ok(null) when still processing", async () => {
      globalThis.fetch = mockFetch(200, { status: "processing_record" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getVoiceId("task-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBeNull();
    });

    it("returns ok(voiceId) on success", async () => {
      globalThis.fetch = mockFetch(200, { status: "success", voice_id: "voice-99" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getVoiceId("task-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("voice-99");
    });

    it("returns err(GENERATION_FAILED) on processing_record_fail", async () => {
      globalThis.fetch = mockFetch(200, {
        status: "processing_record_fail",
        error: "bad recording",
      });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.getVoiceId("task-1");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("GENERATION_FAILED");
        expect(r.error.retryable).toBe(false);
      }
    });
  });

  describe("pollRecordInfo", () => {
    it("returns err(POLLING_ABORTED) immediately when aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.pollRecordInfo("task-1", {
        interval: 1,
        maxAttempts: 3,
        abortSignal: controller.signal,
      });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("POLLING_ABORTED");
    });

    it("returns err(POLLING_TIMEOUT) when max attempts exhausted", async () => {
      globalThis.fetch = mockFetch(200, { status: "processing_record" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.pollRecordInfo("task-1", { interval: 1, maxAttempts: 2 });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("POLLING_TIMEOUT");
    });

    it("returns ok(voiceId) when API returns one", async () => {
      const calls = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ status: "processing_record" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ status: "success", voice_id: "v-1" }),
        });
      globalThis.fetch = calls as unknown as typeof globalThis.fetch;

      const svc = new VoiceCloneService(BASE_CONFIG);
      const r = await svc.pollRecordInfo("task-1", { interval: 1, maxAttempts: 5 });
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("v-1");
    });
  });

  describe("checkVoiceAvailability", () => {
    it("returns ok(true) when ready and available", async () => {
      globalThis.fetch = mockFetch(200, { status: "ready", is_available: true });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.checkVoiceAvailability({ voiceId: "v-1", taskId: "t-1" });
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(true);
    });

    it("returns ok(false) when not ready", async () => {
      globalThis.fetch = mockFetch(200, { status: "pending", is_available: false });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.checkVoiceAvailability({ voiceId: "v-1", taskId: "t-1" });
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(false);
    });

    it("returns err(AVAILABILITY_FAILED) when status is failed", async () => {
      globalThis.fetch = mockFetch(200, { status: "failed", error: "nope" });
      const svc = new VoiceCloneService(BASE_CONFIG);

      const r = await svc.checkVoiceAvailability({ voiceId: "v-1", taskId: "t-1" });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("AVAILABILITY_FAILED");
        expect(r.error.retryable).toBe(false);
      }
    });
  });

  describe("getRecommendedSegmentTimes", () => {
    it("returns padded range around middle", async () => {
      const { getRecommendedSegmentTimes } = await import("../VoiceCloneService");
      const out = getRecommendedSegmentTimes(60);
      expect(out.recommendedStart).toBe(5);
      expect(out.recommendedEnd).toBe(55);
    });
  });
});
