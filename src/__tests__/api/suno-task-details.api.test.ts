/**
 * Unit tests for suno-task-details.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getSunoTaskDetails, isSunoTaskType, POLL_INTERVAL_MS_BY_TYPE } from "@/api/suno-task-details.api";

const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe("suno-task-details.api", () => {
  describe("getSunoTaskDetails", () => {
    it("invokes correct edge function for music type", async () => {
      const response = { success: true, taskId: "t1", status: "SUCCESS" };
      mockFunctions.invoke.mockResolvedValue({ data: response, error: null });
      const res = await getSunoTaskDetails("music", "t1");
      expect(res).toEqual(response);
      expect(mockFunctions.invoke).toHaveBeenCalledWith("suno-music-details", { body: { taskId: "t1" } });
    });

    it("invokes correct edge function for each task type", async () => {
      const types = ["music", "cover", "video", "wav", "midi", "lyrics", "separation"] as const;
      const edges = [
        "suno-music-details",
        "suno-cover-details",
        "suno-video-details",
        "suno-wav-details",
        "suno-midi-details",
        "suno-lyrics-details",
        "suno-separation-details",
      ];
      for (let i = 0; i < types.length; i++) {
        mockFunctions.invoke.mockResolvedValue({
          data: { success: true, taskId: "t1", status: "SUCCESS" },
          error: null,
        });
        await getSunoTaskDetails(types[i], "t1");
        expect(mockFunctions.invoke).toHaveBeenCalledWith(edges[i], { body: { taskId: "t1" } });
      }
    });

    it("throws on edge function error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "edge failed" } });
      await expect(getSunoTaskDetails("music", "t1")).rejects.toThrow("edge failed");
    });

    it("throws when no data returned", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: null });
      await expect(getSunoTaskDetails("music", "t1")).rejects.toThrow("suno-music-details returned no data");
    });
  });

  describe("isSunoTaskType", () => {
    it("returns true for valid task types", () => {
      expect(isSunoTaskType("music")).toBe(true);
      expect(isSunoTaskType("cover")).toBe(true);
      expect(isSunoTaskType("video")).toBe(true);
      expect(isSunoTaskType("wav")).toBe(true);
      expect(isSunoTaskType("midi")).toBe(true);
      expect(isSunoTaskType("lyrics")).toBe(true);
      expect(isSunoTaskType("separation")).toBe(true);
    });

    it("returns false for invalid types", () => {
      expect(isSunoTaskType("invalid")).toBe(false);
      expect(isSunoTaskType("")).toBe(false);
      expect(isSunoTaskType(null)).toBe(false);
      expect(isSunoTaskType(undefined)).toBe(false);
      expect(isSunoTaskType(123)).toBe(false);
    });
  });

  describe("POLL_INTERVAL_MS_BY_TYPE", () => {
    it("has intervals for all task types", () => {
      expect(POLL_INTERVAL_MS_BY_TYPE.lyrics).toBe(1500);
      expect(POLL_INTERVAL_MS_BY_TYPE.cover).toBe(2000);
      expect(POLL_INTERVAL_MS_BY_TYPE.music).toBe(2000);
      expect(POLL_INTERVAL_MS_BY_TYPE.wav).toBe(3000);
      expect(POLL_INTERVAL_MS_BY_TYPE.video).toBe(3000);
      expect(POLL_INTERVAL_MS_BY_TYPE.separation).toBe(4000);
      expect(POLL_INTERVAL_MS_BY_TYPE.midi).toBe(5000);
    });
  });
});
