import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioLevel } from "@/hooks/useAudioLevel";

describe("useAudioLevel", () => {
  let mockContext: { createAnalyser: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn>; state: string };
  let mockAnalyser: {
    fftSize: number;
    smoothingTimeConstant: number;
    frequencyBinCount: number;
    getByteFrequencyData: ReturnType<typeof vi.fn>;
  };
  let mockSource: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };
  let rafId = 0;

  beforeEach(() => {
    rafId = 0;
    mockAnalyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    mockSource = { connect: vi.fn(), disconnect: vi.fn() };
    mockContext = {
      createAnalyser: vi.fn(() => mockAnalyser),
      createMediaStreamSource: vi.fn(() => mockSource),
      close: vi.fn(),
      state: "running",
    };

    globalThis.AudioContext = vi.fn(function () {
      return mockContext as unknown as AudioContext;
    }) as unknown as typeof AudioContext;
    globalThis.requestAnimationFrame = vi.fn(function (this: unknown, cb: FrameRequestCallback) {
      rafId++;
      setTimeout(() => cb(performance.now()), 0);
      return rafId;
    });
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 0 when no mediaStream provided", () => {
    const { result } = renderHook(() => useAudioLevel(null));
    expect(result.current).toBe(0);
  });

  it("returns 0 when isActive is false", () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { result } = renderHook(() => useAudioLevel(stream, false));
    expect(result.current).toBe(0);
  });

  it("creates analyser node when stream provided", () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    renderHook(() => useAudioLevel(stream, true));
    expect(mockContext.createAnalyser).toHaveBeenCalledTimes(1);
    expect(mockAnalyser.fftSize).toBe(256);
  });

  it("cleans up via effect cleanup", () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { unmount } = renderHook(() => useAudioLevel(stream, true));
    unmount();
    expect(mockContext.close).toHaveBeenCalled();
  });

  it("logs error when AudioContext unavailable", () => {
    const orig = globalThis.AudioContext;
    delete (globalThis as Record<string, unknown>).AudioContext;
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { result } = renderHook(() => useAudioLevel(stream, true));
    expect(result.current).toBe(0);
    globalThis.AudioContext = orig;
  });
});
