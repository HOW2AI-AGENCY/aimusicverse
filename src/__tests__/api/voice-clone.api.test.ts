/**
 * Unit tests for voice-clone.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { voiceCloneApi, VoiceApiError } from "@/api/voice-clone.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };
const mockStorage = supabase.storage as unknown as { from: ReturnType<typeof vi.fn> };

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

describe("voice-clone.api", () => {
  describe("VoiceApiError", () => {
    it("has code and message", () => {
      const err = new VoiceApiError("test error", "TEST_CODE");
      expect(err.message).toBe("test error");
      expect(err.code).toBe("TEST_CODE");
      expect(err).toBeInstanceOf(Error);
    });

    it("defaults code to UNKNOWN", () => {
      const err = new VoiceApiError("test");
      expect(err.code).toBe("UNKNOWN");
    });
  });

  describe("voiceCloneApi.list", () => {
    it("fetches voices for user", async () => {
      const voices = [{ id: "v1", name: "My Voice" }];
      mockFrom.mockReturnValue(chainMock({ data: voices, error: null }));
      const res = await voiceCloneApi.list("u1");
      expect(res).toEqual(voices);
    });

    it("returns empty array when null data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await voiceCloneApi.list("u1");
      expect(res).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "db error" } }));
      await expect(voiceCloneApi.list("u1")).rejects.toThrow("db error");
    });
  });

  describe("voiceCloneApi.remove", () => {
    it("deletes voice", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(voiceCloneApi.remove("v1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "delete failed" } }));
      await expect(voiceCloneApi.remove("v1")).rejects.toThrow("delete failed");
    });
  });

  describe("voiceCloneApi.uploadSource", () => {
    it("uploads source audio", async () => {
      const bucket = {
        upload: vi.fn().mockResolvedValue({ data: { path: "u1/source_123.mp3" }, error: null }),
      };
      mockStorage.from.mockReturnValue(bucket);
      const file = new Blob(["audio"], { type: "audio/mpeg" });
      const path = await voiceCloneApi.uploadSource("u1", file);
      expect(path).toMatch(/^u1\/source_.*\.mp3$/);
      expect(mockStorage.from).toHaveBeenCalledWith("voice-sources");
    });

    it("throws on upload error", async () => {
      const bucket = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "upload failed" } }),
      };
      mockStorage.from.mockReturnValue(bucket);
      await expect(voiceCloneApi.uploadSource("u1", new Blob(["x"]))).rejects.toThrow("upload failed");
    });
  });

  describe("voiceCloneApi.uploadVerification", () => {
    it("uploads verification audio", async () => {
      const bucket = {
        upload: vi.fn().mockResolvedValue({ data: { path: "u1/verify_123.webm" }, error: null }),
      };
      mockStorage.from.mockReturnValue(bucket);
      const path = await voiceCloneApi.uploadVerification("u1", new Blob(["audio"]));
      expect(path).toMatch(/^u1\/verify_.*\.webm$/);
      expect(mockStorage.from).toHaveBeenCalledWith("voice-verifications");
    });
  });

  describe("voiceCloneApi.validate", () => {
    it("invokes suno-voice-validate", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, voice: {}, taskId: "t1" }, error: null });
      const res = await voiceCloneApi.validate({
        voiceName: "My Voice",
        sourcePath: "u1/source.mp3",
        vocalStartS: 0,
        vocalEndS: 30,
      });
      expect(res.taskId).toBe("t1");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-voice-validate", expect.any(Object));
    });

    it("throws VoiceApiError on network error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "network fail" } });
      await expect(
        voiceCloneApi.validate({ voiceName: "V", sourcePath: "p", vocalStartS: 0, vocalEndS: 10 }),
      ).rejects.toThrow(VoiceApiError);
    });

    it("throws VoiceApiError on response error field", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { error: "validation failed", code: "VALIDATION" }, error: null });
      await expect(
        voiceCloneApi.validate({ voiceName: "V", sourcePath: "p", vocalStartS: 0, vocalEndS: 10 }),
      ).rejects.toThrow("validation failed");
    });
  });

  describe("voiceCloneApi.generate", () => {
    it("invokes suno-voice-generate", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, taskId: "gen-1" }, error: null });
      const res = await voiceCloneApi.generate("vr1", "u1/verify.webm");
      expect(res.taskId).toBe("gen-1");
    });
  });

  describe("voiceCloneApi.regenerate", () => {
    it("invokes suno-voice-regenerate", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, taskId: "regen-1" }, error: null });
      const res = await voiceCloneApi.regenerate("vr1");
      expect(res.taskId).toBe("regen-1");
    });
  });

  describe("voiceCloneApi.checkVoice", () => {
    it("invokes suno-voice-check-voice", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, available: true }, error: null });
      const res = await voiceCloneApi.checkVoice("voice-123");
      expect(res.available).toBe(true);
    });
  });
});
