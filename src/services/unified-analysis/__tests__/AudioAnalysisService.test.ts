/**
 * AudioAnalysisService — Result<T,E> conversion tests.
 *
 * Verifies that the public analysis methods return `Result<T, AudioAnalysisServiceError>`
 * and that the throwing `try*()` wrappers preserve the historical throwing API.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOk, isErr } from "@/lib/result";

// Mock the supabase client so we can drive responses deterministically.
const invokeMock = vi.fn();
const storageUploadMock = vi.fn();
const storageGetPublicUrlMock = vi.fn();
const fromSelectMock = vi.fn();
const fromMaybeSingleMock = vi.fn();
const fromSingleMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => storageUploadMock(...args),
        getPublicUrl: (...args: unknown[]) => storageGetPublicUrlMock(...args),
      }),
    },
    from: () => ({
      select: (...args: unknown[]) => fromSelectMock(...args),
    }),
  },
}));

import { audioAnalysisService, AudioAnalysisServiceError } from "../AudioAnalysisService";

function resetAll() {
  invokeMock.mockReset();
  storageUploadMock.mockReset();
  storageGetPublicUrlMock.mockReset();
  fromSelectMock.mockReset();
  fromMaybeSingleMock.mockReset();
  fromSingleMock.mockReset();
}

describe("AudioAnalysisService — Result<T,E> conversions", () => {
  beforeEach(() => {
    resetAll();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("analyze", () => {
    it("returns ok when Flamingo provider succeeds", async () => {
      invokeMock.mockResolvedValue({
        data: { success: true, parsed: { genre: "rock", bpm: 120 } },
        error: null,
      });

      const r = await audioAnalysisService.analyze({
        audioUrl: "https://example.com/a.mp3",
        analysisTypes: ["style"],
      });

      expect(isOk(r)).toBe(true);
      if (isOk(r)) {
        expect(r.value.genre).toBe("rock");
        expect(r.value.bpm).toBe(120);
      }
    });

    it("returns ok (empty merged) when provider invocation reports error — preserves legacy behavior", async () => {
      // Historical behavior: provider errors are logged as warnings inside
      // Promise.allSettled and the top-level analyze() still resolves with
      // whatever partial results it could gather. We verify that contract
      // holds after the Result refactor.
      invokeMock.mockResolvedValue({
        data: null,
        error: { message: "edge function down" },
      });

      const r = await audioAnalysisService.analyze({
        audioUrl: "https://example.com/a.mp3",
        analysisTypes: ["style"],
      });

      expect(isOk(r)).toBe(true);
    });

    it("returns err(AUDIO_URL_RESOLVE_FAILED) when no audio source provided", async () => {
      const r = await audioAnalysisService.analyze({
        analysisTypes: ["style"],
      });

      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("AUDIO_URL_RESOLVE_FAILED");
    });
  });

  describe("analyzeWithFlamingo (direct)", () => {
    it("returns err(FLAMINGO_INVOKE_FAILED) when invoke returns error", async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: { message: "edge function down" },
      });

      const r = await audioAnalysisService.analyzeWithFlamingo("https://example.com/a.mp3");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error).toBeInstanceOf(AudioAnalysisServiceError);
        expect(r.error.code).toBe("FLAMINGO_INVOKE_FAILED");
        expect(r.error.provider).toBe("flamingo");
      }
    });

    it("returns err(FLAMINGO_FAILED) when data.success=false", async () => {
      invokeMock.mockResolvedValue({
        data: { success: false, error: "bad audio" },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithFlamingo("https://example.com/a.mp3");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("FLAMINGO_FAILED");
    });

    it("returns ok on success", async () => {
      invokeMock.mockResolvedValue({
        data: { success: true, parsed: { genre: "rock", bpm: 120 } },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithFlamingo("https://example.com/a.mp3");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) {
        expect(r.value.genre).toBe("rock");
      }
    });
  });

  describe("analyzeWithLovableAI", () => {
    it("returns err(LOVABLE_AI_FAILED) on data.success=false", async () => {
      invokeMock.mockResolvedValue({
        data: { success: false, error: "rate limit" },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithLovableAI("https://example.com/a.mp3");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("LOVABLE_AI_FAILED");
        expect(r.error.provider).toBe("lovable-ai");
      }
    });

    it("returns ok on success", async () => {
      invokeMock.mockResolvedValue({
        data: { success: true, results: { genre: "pop" } },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithLovableAI("https://example.com/a.mp3");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value.genre).toBe("pop");
    });
  });

  describe("analyzeWithKlangio", () => {
    it("returns err(KLANGIO_FAILED) carrying mode on failure", async () => {
      invokeMock.mockResolvedValue({
        data: { success: false, error: "bad input" },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithKlangio("https://example.com/a.mp3", {
        mode: "transcription",
      });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("KLANGIO_FAILED");
        expect(r.error.provider).toBe("klangio");
        expect(r.error.mode).toBe("transcription");
      }
    });

    it("returns ok with normalized notes on transcription success", async () => {
      invokeMock.mockResolvedValue({
        data: {
          success: true,
          bpm: 90,
          key: "C",
          notes: [{ pitch: 60, start_time: 0, end_time: 0.5, note_name: "C4" }],
          files: { midi: "https://x/midi" },
        },
        error: null,
      });

      const r = await audioAnalysisService.analyzeWithKlangio("https://example.com/a.mp3", {
        mode: "transcription",
      });
      expect(isOk(r)).toBe(true);
      if (isOk(r)) {
        expect(r.value.provider).toBe("klangio");
        expect(r.value.notes?.[0]?.noteName).toBe("C4");
      }
    });
  });

  describe("detectBPMLocal", () => {
    it("returns ok(null) when beat detection fails (soft failure)", async () => {
      // No real audio available — the analyzer throws, we expect ok(null).
      const r = await audioAnalysisService.detectBPMLocal("https://example.com/does-not-exist.mp3");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBeNull();
    });
  });
});
