/**
 * Unit tests for audio-watermark.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  watermarkAudio,
  applyWatermark,
  detectWatermark,
  hasWatermark,
  getWatermarkedUrl,
} from "@/api/audio-watermark.api";

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

describe("audio-watermark.api", () => {
  describe("watermarkAudio", () => {
    it("invokes edge function for apply mode", async () => {
      const result = { success: true, mode: "apply" as const, watermarkedUrl: "wm.mp3" };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await watermarkAudio({ audioUrl: "orig.mp3", mode: "apply" });
      expect(res).toEqual(result);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("replicate-audio-watermark", {
        body: { audioUrl: "orig.mp3", mode: "apply" },
      });
    });

    it("invokes edge function for detect mode", async () => {
      const result = { success: true, mode: "detect" as const, hasWatermark: true };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await watermarkAudio({ audioUrl: "orig.mp3", mode: "detect" });
      expect(res.hasWatermark).toBe(true);
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "watermark failed" } });
      await expect(watermarkAudio({ audioUrl: "bad.mp3", mode: "apply" })).rejects.toThrow("watermark failed");
    });

    it("throws when no data returned", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      await expect(watermarkAudio({ audioUrl: "empty.mp3", mode: "apply" })).rejects.toThrow(
        "No response from watermark service",
      );
    });
  });

  describe("applyWatermark", () => {
    it("delegates to watermarkAudio with apply mode", async () => {
      const result = { success: true, mode: "apply" as const };
      mockFunctions.invoke.mockResolvedValue({ data: result, error: null });
      const res = await applyWatermark("audio.mp3", "t1");
      expect(res.mode).toBe("apply");
      expect(mockFunctions.invoke).toHaveBeenCalledWith("replicate-audio-watermark", {
        body: { audioUrl: "audio.mp3", trackId: "t1", mode: "apply" },
      });
    });
  });

  describe("detectWatermark", () => {
    it("returns true when watermark detected", async () => {
      mockFunctions.invoke.mockResolvedValue({
        data: { success: true, mode: "detect", hasWatermark: true },
        error: null,
      });
      expect(await detectWatermark("audio.mp3")).toBe(true);
    });

    it("returns false when no watermark", async () => {
      mockFunctions.invoke.mockResolvedValue({
        data: { success: true, mode: "detect", hasWatermark: false },
        error: null,
      });
      expect(await detectWatermark("audio.mp3")).toBe(false);
    });

    it("returns false when hasWatermark is undefined", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { success: true, mode: "detect" }, error: null });
      expect(await detectWatermark("audio.mp3")).toBe(false);
    });
  });

  describe("hasWatermark", () => {
    it("returns true when track is watermarked", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { is_watermarked: true }, error: null }));
      expect(await hasWatermark("t1")).toBe(true);
    });

    it("returns false when track is not watermarked", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { is_watermarked: false }, error: null }));
      expect(await hasWatermark("t1")).toBe(false);
    });

    it("returns false when no data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await hasWatermark("t1")).toBe(false);
    });
  });

  describe("getWatermarkedUrl", () => {
    it("returns watermarked URL", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { watermarked_url: "wm.mp3" }, error: null }));
      expect(await getWatermarkedUrl("t1")).toBe("wm.mp3");
    });

    it("returns null when no URL", async () => {
      mockFrom.mockReturnValue(chainMock({ data: { watermarked_url: null }, error: null }));
      expect(await getWatermarkedUrl("t1")).toBeNull();
    });
  });
});
