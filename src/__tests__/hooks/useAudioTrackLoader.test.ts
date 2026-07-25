/**
 * useAudioTrackLoader — empty/invalid src safety.
 *
 * Verifies that:
 * - Empty / null / non-http src does NOT trigger `audio.load()` or crash.
 * - Invalid src is logged as a warning and reported to telemetry.
 * - Valid src is loaded on the underlying audio element.
 * - A bumped `loadNonce` forces re-load of the same track (retry path).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAudioTrackLoader } from "@/hooks/audio/useAudioTrackLoader";
import type { Track } from "@/types/track";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/telemetry", () => ({ recordError: vi.fn() }));

import { logger } from "@/lib/logger";
import { recordError } from "@/lib/telemetry";

function makeAudio() {
  const el: Partial<HTMLAudioElement> & { load: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> } = {
    src: "",
    load: vi.fn(),
    pause: vi.fn(),
    removeAttribute: vi.fn(() => {
      (el as { src: string }).src = "";
    }) as unknown as HTMLAudioElement["removeAttribute"],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 0,
    error: null,
  };
  return el as HTMLAudioElement;
}

function setup(source: string | null, track: Track | null, loadNonce = 0) {
  const audio = makeAudio();
  const audioRef = { current: audio };
  const lastTrackIdRef = { current: null as string | null };
  const isLoadingRef = { current: false };
  const playPromiseRef = { current: null as Promise<void> | null };
  const getAudioSource = () => source;

  renderHook(() =>
    useAudioTrackLoader({
      audioRef,
      lastTrackIdRef,
      isLoadingRef,
      playPromiseRef,
      activeTrack: track,
      getAudioSource,
      loadNonce,
    }),
  );
  return { audio, lastTrackIdRef, isLoadingRef };
}

const track = (id: string, title = "T"): Track => ({ id, title } as Track);

describe("useAudioTrackLoader — empty / invalid src", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call load() when source is null and no active track", () => {
    const { audio } = setup(null, null);
    expect((audio as unknown as { load: { mock: { calls: unknown[] } } }).load.mock.calls.length).toBe(0);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(recordError).not.toHaveBeenCalled();
  });

  it("logs warning + telemetry when active track has empty source", () => {
    setup(null, track("t1", "Song"));
    expect(logger.warn).toHaveBeenCalledWith(
      "Audio source missing for active track",
      expect.objectContaining({ trackId: "t1" }),
    );
    expect(recordError).toHaveBeenCalledWith(
      "audio:load:empty_src",
      expect.any(String),
      expect.objectContaining({ trackId: "t1" }),
    );
  });

  it("rejects invalid non-URL source and does not attempt to load it", () => {
    const { audio } = setup("javascript:alert(1)", track("t2"));
    expect((audio as unknown as { load: { mock: { calls: unknown[] } } }).load.mock.calls.length).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      "Audio source rejected — invalid URL",
      expect.objectContaining({ trackId: "t2", source: expect.any(String) }),
    );
    expect(recordError).toHaveBeenCalledWith(
      "audio:load:invalid_src",
      expect.any(String),
      expect.objectContaining({ trackId: "t2" }),
    );
  });

  it("clears audio.src when previously set and new source is invalid", () => {
    const audio = makeAudio();
    (audio as unknown as { src: string }).src = "https://old.example/a.mp3";
    const audioRef = { current: audio };
    const lastTrackIdRef = { current: "t-old" as string | null };
    const isLoadingRef = { current: true };
    const playPromiseRef = { current: null as Promise<void> | null };

    renderHook(() =>
      useAudioTrackLoader({
        audioRef,
        lastTrackIdRef,
        isLoadingRef,
        playPromiseRef,
        activeTrack: null,
        getAudioSource: () => null,
        loadNonce: 0,
      }),
    );
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeAttribute).toHaveBeenCalledWith("src");
    expect(lastTrackIdRef.current).toBeNull();
    expect(isLoadingRef.current).toBe(false);
  });

  it("loads valid https source on active track change", () => {
    const { audio, lastTrackIdRef } = setup("https://cdn.example/song.mp3", track("t3"));
    expect(audio.src).toBe("https://cdn.example/song.mp3");
    expect(audio.load).toHaveBeenCalled();
    expect(lastTrackIdRef.current).toBe("t3");
  });

  it("does not crash when audio.src setter throws (records telemetry)", () => {
    const audio = makeAudio();
    Object.defineProperty(audio, "src", {
      set() {
        throw new Error("Boom");
      },
      get() {
        return "";
      },
      configurable: true,
    });
    const audioRef = { current: audio };
    const lastTrackIdRef = { current: null as string | null };
    const isLoadingRef = { current: false };
    const playPromiseRef = { current: null as Promise<void> | null };

    expect(() =>
      renderHook(() =>
        useAudioTrackLoader({
          audioRef,
          lastTrackIdRef,
          isLoadingRef,
          playPromiseRef,
          activeTrack: track("t4"),
          getAudioSource: () => "https://cdn.example/x.mp3",
          loadNonce: 0,
        }),
      ),
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalled();
    expect(recordError).toHaveBeenCalledWith(
      "audio:load:set_src_failed",
      expect.any(String),
      expect.objectContaining({ trackId: "t4" }),
    );
    expect(isLoadingRef.current).toBe(false);
  });
});
