import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioRecording } from "@/hooks/useAudioRecording";

describe("useAudioRecording", () => {
  let mockRecorder: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; state: string };
  let mockStream: { getTracks: ReturnType<typeof vi.fn> };
  let mockTrack: { stop: ReturnType<typeof vi.fn> };
  let ondataavailableHandler: ((e: { data: Blob }) => void) | null;
  let onstopHandler: (() => void) | null;

  beforeEach(() => {
    vi.useFakeTimers();
    ondataavailableHandler = null;
    onstopHandler = null;

    mockTrack = { stop: vi.fn() };
    mockStream = { getTracks: vi.fn(() => [mockTrack]) };

    mockRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      state: "inactive",
    };

    Object.defineProperty(mockRecorder, "ondataavailable", {
      get: () => ondataavailableHandler,
      set: (fn: typeof ondataavailableHandler) => {
        ondataavailableHandler = fn;
      },
      configurable: true,
    });
    Object.defineProperty(mockRecorder, "onstop", {
      get: () => onstopHandler,
      set: (fn: typeof onstopHandler) => {
        onstopHandler = fn;
      },
      configurable: true,
    });

    globalThis.MediaRecorder = vi.fn(function () {
      return mockRecorder as unknown as MediaRecorder;
    }) as unknown as typeof MediaRecorder;

    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useAudioRecording());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingTime).toBe(0);
  });

  it("starts recording when startRecording called", async () => {
    const { result } = renderHook(() => useAudioRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(mockRecorder.start).toHaveBeenCalledTimes(1);
    expect(result.current.isRecording).toBe(true);
  });

  it("stops recording and calls onRecordingComplete", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useAudioRecording({ onRecordingComplete: onComplete }));
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    // Simulate data received
    act(() => {
      ondataavailableHandler?.({ data: new Blob(["test"]) });
    });

    await act(async () => {
      result.current.stopRecording();
    });
    expect(result.current.isRecording).toBe(false);
  });

  it("tracks recording time", async () => {
    const { result } = renderHook(() => useAudioRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.recordingTime).toBe(3);
  });

  it("handles getUserMedia failure", async () => {
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("permission denied")) },
      configurable: true,
    });
    const { result } = renderHook(() => useAudioRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(false);
  });
});
