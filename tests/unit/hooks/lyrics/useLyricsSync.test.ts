/**
 * Unit tests for useLyricsSync hook
 * Tests for currentTime tracking, activeLine detection, and sync accuracy
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useLyricsSync, LyricsTimestamp } from '@/hooks/lyrics/useLyricsSync';

describe('useLyricsSync - T023', () => {
  const mockTimestamps: LyricsTimestamp[] = [
    { lineIndex: 0, startTime: 0, endTime: 5 },
    { lineIndex: 1, startTime: 5, endTime: 10 },
    { lineIndex: 2, startTime: 10, endTime: 15 },
    { lineIndex: 3, startTime: 15, endTime: 20 },
    { lineIndex: 4, startTime: 20, endTime: 25 },
  ];

  const defaultProps = {
    timestamps: mockTimestamps,
    currentTime: 0,
    duration: 25,
    isPlaying: false,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Active Line Detection', () => {
    it('should return -1 when currentTime is 0', () => {
      const { result } = renderHook(() => useLyricsSync(defaultProps));

      expect(result.current.activeLineIndex).toBe(-1);
    });

    it('should detect active line based on currentTime', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 7.5 })
      );

      expect(result.current.activeLineIndex).toBe(1);
    });

    it('should handle boundary conditions at line transitions', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 5 })
      );

      expect(result.current.activeLineIndex).toBe(1);
    });

    it('should return last line index when currentTime is beyond last timestamp', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 30 })
      );

      expect(result.current.activeLineIndex).toBe(4);
    });
  });

  describe('Next Line Detection', () => {
    it('should return next line index', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 7.5 })
      );

      expect(result.current.nextLineIndex).toBe(2);
    });

    it('should return -1 when at last line', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 22.5 })
      );

      expect(result.current.nextLineIndex).toBe(-1);
    });

    it('should return first line when no active line', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      expect(result.current.nextLineIndex).toBe(0);
    });
  });

  describe('Line Progress Calculation', () => {
    it('should calculate progress within current line', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 7.5 })
      );

      // Line 1: 5-10, currentTime 7.5 = 50% progress
      expect(result.current.lineProgress).toBe(0.5);
    });

    it('should return 0 progress when no active line', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      expect(result.current.lineProgress).toBe(0);
    });

    it('should return 0 progress at line start', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 5 })
      );

      expect(result.current.lineProgress).toBe(0);
    });

    it('should return 1 progress at line end', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 10 })
      );

      expect(result.current.lineProgress).toBe(1);
    });
  });

  describe('Position Flags', () => {
    it('should detect when at start', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      expect(result.current.isAtStart).toBe(true);
    });

    it('should detect when not at start', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 7.5 })
      );

      expect(result.current.isAtStart).toBe(false);
    });

    it('should detect when at end', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 25 })
      );

      expect(result.current.isAtEnd).toBe(true);
    });

    it('should detect when not at end', () => {
      const { result } = renderHook(() =>
        useLyricsSync({ ...defaultProps, currentTime: 20 })
      );

      expect(result.current.isAtEnd).toBe(false);
    });
  });

  describe('Seek to Line', () => {
    it('should return start time for valid line index', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      const seekTime = result.current.seekToLine(2);
      expect(seekTime).toBe(10);
    });

    it('should return null for invalid line index', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      const seekTime = result.current.seekToLine(999);
      expect(seekTime).toBeNull();
    });
  });

  describe('Get Line at Time', () => {
    it('should return correct line index for given time', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      const lineIndex = result.current.getLineAtTime(12.5);
      expect(lineIndex).toBe(2);
    });

    it('should return -1 for time before first line', () => {
      const { result } = renderHook(() =>
        useLyricsSync(defaultProps)
      );

      const lineIndex = result.current.getLineAtTime(-1);
      expect(lineIndex).toBe(-1);
    });
  });

  describe('Active Line Change Callback', () => {
    it('should call onActiveLineChange when active line changes', () => {
      const onActiveLineChange = vi.fn();

      const { rerender } = renderHook(
        ({ currentTime }) =>
          useLyricsSync({
            ...defaultProps,
            currentTime,
            onActiveLineChange,
          }),
        { initialProps: { currentTime: 0 } }
      );

      // Update currentTime to trigger line change
      act(() => {
        rerender({ currentTime: 7.5 });
      });

      expect(onActiveLineChange).toHaveBeenCalledWith(1);
    });

    it('should not call onActiveLineChange when active line stays same', () => {
      const onActiveLineChange = vi.fn();

      const { rerender } = renderHook(
        ({ currentTime }) =>
          useLyricsSync({
            ...defaultProps,
            currentTime,
            onActiveLineChange,
          }),
        { initialProps: { currentTime: 7.5 } }
      );

      act(() => {
        rerender({ currentTime: 8 });
      });

      expect(onActiveLineChange).not.toHaveBeenCalled();
    });
  });

  describe('Optimization', () => {
    it('should use binary search for efficient line detection', () => {
      // Create large timestamps array to test binary search efficiency
      const largeTimestamps: LyricsTimestamp[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          lineIndex: i,
          startTime: i * 5,
          endTime: (i + 1) * 5,
        })
      );

      const { result } = renderHook(() =>
        useLyricsSync({
          ...defaultProps,
          timestamps: largeTimestamps,
          currentTime: 2500, // Middle of array
        })
      );

      // Should find line 500 efficiently using binary search
      expect(result.current.activeLineIndex).toBe(500);
    });

    it('should debounce scroll updates when not playing', () => {
      const onActiveLineChange = vi.fn();

      const { rerender } = renderHook(
        ({ currentTime }) =>
          useLyricsSync({
            ...defaultProps,
            currentTime,
            isPlaying: false,
            onActiveLineChange,
            scrollThreshold: 100,
          }),
        { initialProps: { currentTime: 7.5 } }
      );

      act(() => {
        rerender({ currentTime: 8 });
      });

      // Should debounce due to scrollThreshold
      expect(onActiveLineChange).not.toHaveBeenCalled();
    });
  });
});
