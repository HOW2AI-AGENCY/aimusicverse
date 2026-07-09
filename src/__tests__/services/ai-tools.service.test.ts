/**
 * Unit tests for lyrics/ai-tools.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as lyricsApi from "@/api/lyrics.api";

vi.mock("@/api/lyrics.api", () => ({
  invokeLyricsAssistant: vi.fn(),
}));

import {
  executeAiTool,
  sendAiChatMessage,
  generateLyrics,
  improveLyrics,
  addLyricsTags,
} from "@/services/lyrics/ai-tools.service";

describe("lyrics/ai-tools.service", () => {
  describe("executeAiTool", () => {
    it("calls invokeLyricsAssistant with params", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { suggestions: ["try chorus first"] },
        error: null,
      } as never);

      const result = await executeAiTool({ action: "suggest", context: "verse" });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({ action: "suggest", context: "verse" });
      expect(result.data?.suggestions).toEqual(["try chorus first"]);
    });

    it("returns error when edge function fails", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: null,
        error: new Error("AI failed"),
      });

      const result = await executeAiTool({ action: "suggest" });

      expect(result.error).toBeDefined();
    });
  });

  describe("sendAiChatMessage", () => {
    it("calls invokeLyricsAssistant with chat action", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "new idea" },
        error: null,
      } as never);

      const result = await sendAiChatMessage({
        message: "make it happier",
        context: { genre: "pop" },
      });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({
        action: "chat",
        message: "make it happier",
        context: { genre: "pop" },
      });
      expect(result.data?.lyrics).toBe("new idea");
    });
  });

  describe("generateLyrics", () => {
    it("calls invokeLyricsAssistant with generate action", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "Sunny day ..." },
        error: null,
      } as never);

      const result = await generateLyrics({
        theme: "sunshine",
        genre: "pop",
        mood: "happy",
        structure: "verse-chorus",
        language: "en",
      });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({
        action: "generate",
        theme: "sunshine",
        genre: "pop",
        mood: "happy",
        structure: "verse-chorus",
        language: "en",
      });
      expect(result.data?.lyrics).toBe("Sunny day ...");
    });
  });

  describe("improveLyrics", () => {
    it("calls invokeLyricsAssistant with improve action", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "Improved ..." },
        error: null,
      } as never);

      const result = await improveLyrics({ existingLyrics: "Old lyrics", language: "en" });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({
        action: "improve",
        lyrics: "Old lyrics",
        language: "en",
      });
      expect(result.data?.lyrics).toBe("Improved ...");
    });
  });

  describe("addLyricsTags", () => {
    it("calls invokeLyricsAssistant with add_tags action", async () => {
      vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
        data: { lyrics: "[Verse] Hello" },
        error: null,
      } as never);

      const result = await addLyricsTags({ existingLyrics: "Hello" });

      expect(lyricsApi.invokeLyricsAssistant).toHaveBeenCalledWith({
        action: "add_tags",
        lyrics: "Hello",
      });
      expect(result.data?.lyrics).toBe("[Verse] Hello");
    });
  });
});
