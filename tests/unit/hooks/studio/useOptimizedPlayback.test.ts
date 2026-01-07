/**
 * T080: Unit tests for useOptimizedPlayback hook
 * Tests for optimized playback state management with RAF throttling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useOptimizedPlayback } from '@/hooks/studio/useOptimizedPlayback';

// Mock HTMLAudioElement
class MockAudioElement {
  paused = true;
  currentTime = 0;
  duration = 0;
  playbackRate = 1;
  buffered = {
    length: 0,
    end: vi.fn(() => 0),
  };
  error = null;

  // Event listeners
  eventListeners: Record<string, Function[]> = {};

  addEventListener(event: string, handler: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (!this.eventListeners[event]) return;
    const index = this.eventListeners[event].indexOf(handler);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  triggerEvent(event: string, ...args: any[]) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(handler => handler(...args));
  }

  async play() {
    this.paused = false;
    this.triggerEvent('canplay');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

describe('T080 - useOptimizedPlayback', () => {
  let audioRef: React.RefObject<HTMLAudioElement>;
  let mockAudio: MockAudioElement;

  beforeEach(() => {
    mockAudio = new MockAudioElement() as unknown as MockAudioElement;
    audioRef = { current: mockAudio as unknown as HTMLAudioElement };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      expect(result.current.state).toEqual({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        buffered: 0,
        playbackRate: 1,
      });
    });

    it('should initialize as not buffering', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      expect(result.current.isBuffering).toBe(false);
    });

    it('should load metadata when available', () => {
      mockAudio.duration = 180;

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        mockAudio.triggerEvent('loadedmetadata');
      });

      expect(result.current.state.duration).toBe(180);
    });
  });

  describe('Play Controls', () => {
    it('should play audio', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      let playResult: boolean | undefined;
      await act(async () => {
        playResult = await result.current.play();
      });

      expect(playResult).toBe(true);
      expect(mockAudio.paused).toBe(false);
      expect(result.current.state.isPlaying).toBe(true);
    });

    it('should pause audio', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.pause();
      });

      expect(mockAudio.paused).toBe(true);
      expect(result.current.state.isPlaying).toBe(false);
    });

    it('should toggle playback', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      // Toggle to play
      let toggleResult1: boolean | undefined;
      await act(async () => {
        toggleResult1 = await result.current.toggle();
      });

      expect(toggleResult1).toBe(true);
      expect(result.current.state.isPlaying).toBe(true);

      // Toggle to pause
      let toggleResult2: boolean | undefined;
      await act(async () => {
        toggleResult2 = await result.current.toggle();
      });

      expect(toggleResult2).toBe(false);
      expect(result.current.state.isPlaying).toBe(false);
    });
  });

  describe('Seek Controls', () => {
    it('should seek to specific time', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef, duration: 180 })
      );

      act(() => {
        result.current.seek(45);
      });

      expect(mockAudio.currentTime).toBe(45);
      expect(result.current.state.currentTime).toBe(45);
    });

    it('should clamp seek time to duration', () => {
      mockAudio.duration = 180;

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.seek(200); // Beyond duration
      });

      expect(mockAudio.currentTime).toBe(180);
    });

    it('should clamp negative seek time to 0', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.seek(-10);
      });

      expect(mockAudio.currentTime).toBe(0);
    });

    it('should call onTimeUpdate callback', () => {
      const onTimeUpdate = vi.fn();

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef, onTimeUpdate })
      );

      act(() => {
        result.current.seek(30);
      });

      expect(onTimeUpdate).toHaveBeenCalledWith(30);
    });
  });

  describe('Playback Rate', () => {
    it('should set playback rate', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.setPlaybackRate(1.5);
      });

      expect(mockAudio.playbackRate).toBe(1.5);
      expect(result.current.state.playbackRate).toBe(1.5);
    });

    it('should clamp playback rate to minimum 0.25', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.setPlaybackRate(0.1);
      });

      expect(mockAudio.playbackRate).toBe(0.25);
      expect(result.current.state.playbackRate).toBe(0.25);
    });

    it('should clamp playback rate to maximum 4', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        result.current.setPlaybackRate(5);
      });

      expect(mockAudio.playbackRate).toBe(4);
      expect(result.current.state.playbackRate).toBe(4);
    });
  });

  describe('Time Updates', () => {
    it('should update current time during playback', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({
          audioRef,
          updateInterval: 50,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      // Simulate audio time progression
      mockAudio.currentTime = 1.5;

      // Advance time past update interval
      act(() => {
        vi.advanceTimersByTime(60);
      });

      // Trigger RAF frame
      act(() => {
        vi.advanceTimersByTimeAsync(16);
      });

      expect(result.current.state.currentTime).toBe(1.5);
    });

    it('should throttle time updates', async () => {
      const onTimeUpdate = vi.fn();

      const { result } = renderHook(() =>
        useOptimizedPlayback({
          audioRef,
          onTimeUpdate,
          updateInterval: 100,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      // Simulate multiple rapid time changes
      for (let i = 0; i < 10; i++) {
        mockAudio.currentTime = i * 0.1;
        act(() => {
          vi.advanceTimersByTime(10);
        });
      }

      // Should be throttled to fewer updates
      expect(onTimeUpdate).toHaveBeenCalledTimes(0);
    });

    it('should stop time updates when paused', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      await act(async () => {
        await result.current.play();
        await result.current.pause();
      });

      mockAudio.currentTime = 5;

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not update after pause
      expect(result.current.state.currentTime).not.toBe(5);
    });
  });

  describe('Buffering State', () => {
    it('should set buffering when waiting', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        mockAudio.triggerEvent('waiting');
      });

      expect(result.current.isBuffering).toBe(true);
    });

    it('should clear buffering when can play', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        mockAudio.triggerEvent('waiting');
        mockAudio.triggerEvent('canplay');
      });

      expect(result.current.isBuffering).toBe(false);
    });

    it('should update buffered progress', () => {
      mockAudio.buffered.length = 1;
      mockAudio.buffered.end = vi.fn(() => 45);

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      act(() => {
        mockAudio.triggerEvent('progress');
      });

      expect(result.current.state.buffered).toBe(45);
    });
  });

  describe('Event Handlers', () => {
    it('should call onEnded when audio ends', () => {
      const onEnded = vi.fn();

      renderHook(() =>
        useOptimizedPlayback({ audioRef, onEnded })
      );

      act(() => {
        mockAudio.triggerEvent('ended');
      });

      expect(onEnded).toHaveBeenCalled();
    });

    it('should update isPlaying to false when ended', () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      // Start playing
      act(() => {
        mockAudio.paused = false;
      });

      // Trigger ended event
      act(() => {
        mockAudio.triggerEvent('ended');
      });

      expect(result.current.state.isPlaying).toBe(false);
    });

    it('should call onError when error occurs', () => {
      const onError = vi.fn();
      const mockError = new Error('Network error');

      renderHook(() =>
        useOptimizedPlayback({ audioRef, onError })
      );

      act(() => {
        mockAudio.error = { message: 'Network error' } as any;
        mockAudio.triggerEvent('error');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle play errors gracefully', async () => {
      const onError = vi.fn();
      mockAudio.play = () => Promise.reject(new Error('Play failed'));

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef, onError })
      );

      let playResult: boolean | undefined;
      await act(async () => {
        playResult = await result.current.play();
      });

      expect(playResult).toBe(false);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      const removeEventListenerSpy = vi.spyOn(mockAudio, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'loadedmetadata',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'ended',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'waiting',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'canplay',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'progress',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });

    it('should cancel RAF on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');

      const { unmount } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });

  describe('Optimization', () => {
    it('should not update state if time change is minimal', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({
          audioRef,
          updateInterval: 50,
        })
      );

      const initialRenderCount = 1; // Initial render

      await act(async () => {
        await result.current.play();
      });

      // Simulate tiny time change (< 0.01s)
      mockAudio.currentTime = 0.001;

      act(() => {
        vi.advanceTimersByTime(60);
      });

      // State should not have updated
      expect(result.current.state.currentTime).toBe(0);
    });

    it('should update state only on significant time changes', async () => {
      const { result } = renderHook(() =>
        useOptimizedPlayback({
          audioRef,
          updateInterval: 50,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      // Simulate significant time change
      mockAudio.currentTime = 1.5;

      act(() => {
        vi.advanceTimersByTime(60);
      });

      expect(result.current.state.currentTime).toBe(1.5);
    });

    it('should use RAF for smooth updates', async () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');

      const { result } = renderHook(() =>
        useOptimizedPlayback({ audioRef })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });
  });
});
