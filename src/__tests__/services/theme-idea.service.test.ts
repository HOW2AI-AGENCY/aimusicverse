/**
 * Unit tests for lyrics/theme-idea.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as lyricsApi from "@/api/lyrics.api";

vi.mock("@/api/lyrics.api", () => ({
  invokeLyricsAssistant: vi.fn(),
}));

import { generateThemeIdea } from "@/services/lyrics/theme-idea.service";

describe("lyrics/theme-idea.service", () => {
  describe("generateThemeIdea", () => {
    it("calls invokeLyricsAssistant with generate action and returns lyrics", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "Lost in neon city" },
        error: null,
      } as never);

      const result = await generateThemeIdea({ genre: "synthwave", mood: "melancholy", language: "en" });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({
        action: "generate",
        genre: "synthwave",
        mood: "melancholy",
        language: "en",
        theme: expect.any(String),
      });
      expect(result).toBe("Lost in neon city");
    });

    it("returns null when data has no lyrics", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const result = await generateThemeIdea({ genre: "pop", mood: "happy", language: "en" });

      expect(result).toBeNull();
    });

    it("trims whitespace from lyrics", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "  A quiet sea  " },
        error: null,
      } as never);

      const result = await generateThemeIdea({ genre: "ambient", mood: "calm", language: "en" });

      expect(result).toBe("A quiet sea");
    });

    it("passes custom prompt as theme", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "Custom theme" },
        error: null,
      } as never);

      const result = await generateThemeIdea({
        genre: "rock",
        mood: "angry",
        language: "ru",
        prompt: "бунт на окраине",
      });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "бунт на окраине" }),
      );
      expect(result).toBe("Custom theme");
    });

    it("throws on error", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: null,
        error: new Error("AI rejected"),
      });

      await expect(generateThemeIdea({ genre: "pop", mood: "happy", language: "en" })).rejects.toThrow("AI rejected");
    });
  });
});
