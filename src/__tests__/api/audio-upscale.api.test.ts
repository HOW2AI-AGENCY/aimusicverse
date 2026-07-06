/**
 * Unit tests for audio-upscale.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { upscaleAudio, hasHdAudio, getHdAudioUrl, getUpscaleStatus } from "@/api/audio-upscale.api";

const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };
const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "eq", "single"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("audio-upscale.api", () => {
  describe("upscaleAudio", () => {
    it("invokes replicate-audio-upscale with default params", async () => {
      const result = { success: true, upscaledUrl: "https://hd.mp3", originalUrl: "orig.mp3", quality: "hd" };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await upscaleAudio({ audioUrl: "orig.mp3" });
      expect(res).toEqual(result);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("replicate-audio-upscale", {
        body: expect.objectContaining({ audioUrl: "orig.mp3", ddimSteps: 50, guidanceScale: 3.5 }),
      });
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "upscale failed" } });
      await expect(upscaleAudio({ audioUrl: "bad.mp3" })).rejects.toThrow("upscale failed");
    });

    it("throws when no data returned", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      await expect(upscaleAudio({ audioUrl: "empty.mp3" })).rejects.toThrow("No response from upscale service");
    });

    it("passes custom parameters", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true }, error: null });
      await upscaleAudio({ audioUrl: "a.mp3", trackId: "t1", ddimSteps: 80, guidanceScale: 5, seed: 42 });
      expect(mockFunctions.invoke).toHaveBeenCalledWith("replicate-audio-upscale", {
        body: expect.objectContaining({ trackId: "t1", ddimSteps: 80, guidanceScale: 5, seed: 42 }),
      });
    });
  });

  describe("hasHdAudio", () => {
    it("returns true when track has HD audio", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { audio_url_hd: "hd.mp3", audio_quality: "hd" }, error: null }));
      expect(await hasHdAudio("t1")).toBe(true);
    });

    it("returns false when no HD audio", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { audio_url_hd: null, audio_quality: "standard" }, error: null }));
      expect(await hasHdAudio("t1")).toBe(false);
    });

    it("returns false when no data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await hasHdAudio("t1")).toBe(false);
    });
  });

  describe("getHdAudioUrl", () => {
    it("returns HD URL when present", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { audio_url_hd: "hd.mp3" }, error: null }));
      expect(await getHdAudioUrl("t1")).toBe("hd.mp3");
    });

    it("returns null when no HD URL", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { audio_url_hd: null }, error: null }));
      expect(await getHdAudioUrl("t1")).toBeNull();
    });
  });

  describe("getUpscaleStatus", () => {
    it("returns upscale status", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { upscale_status: "completed" }, error: null }));
      expect(await getUpscaleStatus("t1")).toBe("completed");
    });

    it("returns null when no status", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { upscale_status: null }, error: null }));
      expect(await getUpscaleStatus("t1")).toBeNull();
    });
  });
});
