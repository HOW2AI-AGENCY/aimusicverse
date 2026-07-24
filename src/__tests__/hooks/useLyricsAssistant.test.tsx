/**
 * Tests for useLyricsAssistant hook — harness plumbing for the AI lyrics agent.
 *
 * Covers:
 * - free-form chat sends conversationHistory to backend
 * - `response` text field from chat action is surfaced when no lyrics returned
 * - handleAiAction emits a user-facing action message and stores metadata tags
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as lyricsApi from "@/api/lyrics.api";

vi.mock("@/api/lyrics.api", () => ({
  invokeLyricsAssistant: vi.fn(),
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

import { useLyricsAssistant } from "@/hooks/lyrics/useLyricsAssistant";

const onApply = vi.fn();

function setup() {
  return renderHook(() => useLyricsAssistant({ onApply, currentLyrics: "" }));
}

describe("useLyricsAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes conversationHistory + context to chat action", async () => {
    vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
      data: { response: "Понял!" },
      error: null,
    } as never);

    const { result } = setup();

    // Seed genre/mood so context is meaningful
    await act(async () => {
      await result.current.handleGenreSelect("pop");
    });
    act(() => result.current.handleMoodSelect(["romantic"]));
    act(() => result.current.handleMoodConfirm());

    act(() => result.current.setInputValue("сделай припев ярче"));
    await act(async () => {
      await result.current.handleSend();
    });

    const call = vi.mocked(lyricsApi.invokeLyricsAssistant).mock.calls.at(-1)?.[0];
    expect(call?.action).toBe("chat");
    expect(call?.message).toBe("сделай припев ярче");
    expect(call?.context).toMatchObject({
      genre: "pop",
      mood: ["romantic"],
    });
    expect(Array.isArray((call?.context as { conversationHistory?: unknown[] })?.conversationHistory)).toBe(true);
    // Last assistant message should surface the AI `response` text
    await waitFor(() => {
      const last = result.current.messages.at(-1);
      expect(last?.role).toBe("assistant");
      expect(last?.content).toBe("Понял!");
    });
  });

  it("emits a user message + stores recommendedTags for AI actions", async () => {
    vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
      data: {
        lyrics: "[Verse] hi",
        metadata: {
          recommendedTags: { vocal: ["Male Vocal"], instruments: [], dynamics: [], emotions: [] },
        },
      },
      error: null,
    } as never);

    const { result } = setup();

    await act(async () => {
      await result.current.handleAiAction("improve");
    });

    const userMessages = result.current.messages.filter((m) => m.role === "user");
    expect(userMessages.at(-1)?.content).toBe("Улучшить текст");
    expect(result.current.recommendedTags?.vocal).toContain("Male Vocal");
    expect(result.current.generatedLyrics).toBe("[Verse] hi");
  });

  it("shows friendly error when invocation fails", async () => {
    vi.mocked(lyricsApi.invokeLyricsAssistant).mockResolvedValue({
      data: null,
      error: new Error("boom"),
    } as never);

    const { result } = setup();

    act(() => result.current.setInputValue("test"));
    await act(async () => {
      await result.current.handleSend();
    });

    const last = result.current.messages.at(-1);
    expect(last?.role).toBe("assistant");
    expect(last?.content).toMatch(/Не получилось|Ошибка/);
  });
});
