/**
 * usePreviewAudio — empty / invalid src safety.
 *
 * Ensures the hook never crashes for empty/invalid src, never registers with the
 * pool for them, and emits telemetry with track id, src, and error code when a
 * load actually fails.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/telemetry", () => ({ recordError: vi.fn() }));

// Fake audio element with basic event support.
function makeAudioEl() {
  const listeners: Record<string, Array<() => void>> = {};
  const el = {
    src: "",
    volume: 1,
    paused: true,
    duration: 0,
    currentTime: 0,
    error: null as null | { code: number; message: string },
    load: vi.fn(),
    pause: vi.fn(() => {
      el.paused = true;
    }),
    play: vi.fn(() => Promise.resolve()),
    addEventListener: (name: string, cb: () => void) => {
      (listeners[name] ??= []).push(cb);
    },
    removeEventListener: (name: string, cb: () => void) => {
      listeners[name] = (listeners[name] ?? []).filter((f) => f !== cb);
    },
    dispatch: (name: string) => (listeners[name] ?? []).slice().forEach((f) => f()),
  };
  return el;
}

const audioEl = makeAudioEl();

vi.mock("@/lib/audioElementPool", () => ({
  audioElementPool: { getStats: () => ({}) },
  AudioPriority: { LOW: 0, MEDIUM: 1, HIGH: 2 },
  useAudioElement: () => audioEl as unknown as HTMLAudioElement,
}));

vi.mock("@/hooks/studio/useStudioAudio", () => ({
  registerStudioAudio: vi.fn(),
  unregisterStudioAudio: vi.fn(),
}));

import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { logger } from "@/lib/logger";
import { recordError } from "@/lib/telemetry";
import { registerStudioAudio } from "@/hooks/studio/useStudioAudio";

describe("usePreviewAudio — empty / invalid src", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioEl.src = "";
    audioEl.error = null;
    audioEl.load.mockClear();
    audioEl.play.mockClear();
    audioEl.pause.mockClear();
  });

  it("returns non-loading state and does not touch the pool for empty src", () => {
    const { result } = renderHook(() => usePreviewAudio({ id: "p-empty", src: "" }));
    expect(audioEl.load).not.toHaveBeenCalled();
    expect(registerStudioAudio).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(recordError).not.toHaveBeenCalled();
  });

  it("rejects invalid (javascript:) src with warning + telemetry", () => {
    renderHook(() => usePreviewAudio({ id: "p-bad", src: "javascript:alert(1)" }));
    expect(audioEl.load).not.toHaveBeenCalled();
    expect(registerStudioAudio).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "usePreviewAudio: invalid src rejected",
      expect.objectContaining({ id: "p-bad" }),
    );
    expect(recordError).toHaveBeenCalledWith(
      "preview_audio:invalid_src",
      expect.any(String),
      expect.objectContaining({ id: "p-bad" }),
    );
  });

  it("loads valid https src and registers with studio audio", () => {
    renderHook(() => usePreviewAudio({ id: "p-ok", src: "https://cdn.example/x.mp3" }));
    expect(audioEl.src).toBe("https://cdn.example/x.mp3");
    expect(audioEl.load).toHaveBeenCalled();
    expect(registerStudioAudio).toHaveBeenCalled();
  });

  it("captures MediaError code in telemetry on load failure", () => {
    const onError = vi.fn();
    renderHook(() => usePreviewAudio({ id: "p-fail", src: "https://cdn.example/broken.mp3", onError }));
    act(() => {
      audioEl.error = { code: 4, message: "MEDIA_ERR_SRC_NOT_SUPPORTED" };
      audioEl.dispatch("error");
    });
    expect(onError).toHaveBeenCalled();
    expect(recordError).toHaveBeenCalledWith(
      "preview_audio:load_failed:4",
      "MEDIA_ERR_SRC_NOT_SUPPORTED",
      expect.objectContaining({ id: "p-fail", mediaErrorCode: 4 }),
    );
  });
});
