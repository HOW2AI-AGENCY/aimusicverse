/**
 * Unit tests for useBPMGrid hook
 * Tests for BPM grid functionality, snap, and MBT formatting
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { useBPMGrid } from '@/hooks/useBPMGrid';

// Mock dependencies
vi.mock('@/lib/audio/bpmDetection', () => ({
  detectBPMFromUrl: vi.fn(),
}));

vi.mock('@/lib/audio/beatSnap', () => ({
  snapToGrid: vi.fn(),
  generateGridPositions: vi.fn(),
  getNearestGridPosition: vi.fn(),
  formatAsMeasureBeat: vi.fn(),
}));

import { detectBPMFromUrl } from '@/lib/audio/bpmDetection';
import { snapToGrid, generateGridPositions, getNearestGridPosition, formatAsMeasureBeat } from '@/lib/audio/beatSnap';

describe('useBPMGrid - T082', () => {
  const mockAudioUrl = 'https://example.com/audio.mp3';
  const mockDuration = 180; // 3 minutes

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BPM Detection', () => {
    it('should detect BPM from audio URL', async () => {
      const mockBPMResult = { bpm: 120, offset: 0, confidence: 0.9 };
      (detectBPMFromUrl as any).mockResolvedValue(mockBPMResult);

      const { result } = renderHook(() =>
        useBPMGrid({
          audioUrl: mockAudioUrl,
          duration: mockDuration,
        })
      );

      // Initially should use default BPM
      expect(result.current.bpm).toBe(120);

      // Wait for BPM detection
      await waitFor(() => {
        expect(result.current.isDetectingBPM).toBe(false);
      });

      expect(detectBPMFromUrl).toHaveBeenCalledWith(mockAudioUrl);
    });

    it('should use default BPM when detection fails', async () => {
      (detectBPMFromUrl as any).mockRejectedValue(new Error('Detection failed'));

      const { result } = renderHook(() =>
        useBPMGrid({
          audioUrl: mockAudioUrl,
          duration: mockDuration,
          defaultBPM: 100,
        })
      );

      await waitFor(() => {
        expect(result.current.isDetectingBPM).toBe(false);
      });

      expect(result.current.bpm).toBe(100);
    });

    it('should allow manual BPM override', async () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          audioUrl: mockAudioUrl,
          duration: mockDuration,
          defaultBPM: 120,
        })
      );

      // Set manual BPM
      result.current.setBPM(140);

      expect(result.current.bpm).toBe(140);
      expect(result.current.bpmResult).toEqual({
        bpm: 140,
        offset: 0,
        confidence: 1.0,
      });
    });
  });

  describe('Snap Functionality', () => {
    it('should call snapToGrid with correct options', () => {
      const mockSnapResult = {
        snappedTime: 1.5,
        beatIndex: 3,
        measureIndex: 0,
        gridDuration: 0.5,
      };
      (snapToGrid as any).mockReturnValue(mockSnapResult);

      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
          snapDivision: 4,
        })
      );

      const snapped = result.current.snap(1.3);

      expect(snapToGrid).toHaveBeenCalledWith(1.3, {
        bpm: 120,
        snapDivision: 4,
        timeSignature: 4,
      });
      expect(snapped).toEqual(mockSnapResult);
    });

    it('should get nearest grid position', () => {
      const mockNearest = 1.5;
      (getNearestGridPosition as any).mockReturnValue(mockNearest);

      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
        })
      );

      const nearest = result.current.getNearestGrid(1.3);

      expect(getNearestGridPosition).toHaveBeenCalledWith(1.3, expect.any(Object));
      expect(nearest).toBe(mockNearest);
    });
  });

  describe('Grid Lines Generation', () => {
    it('should generate grid lines for a time range', () => {
      const mockPositions = [0, 0.5, 1.0, 1.5, 2.0];
      (generateGridPositions as any).mockReturnValue(mockPositions);

      const mockSnapResult = {
        snappedTime: 0,
        beatIndex: 0,
        measureIndex: 0,
        gridDuration: 0.5,
      };
      (snapToGrid as any).mockReturnValue(mockSnapResult);

      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
        })
      );

      const lines = result.current.getGridLines(0, 2);

      expect(generateGridPositions).toHaveBeenCalledWith(0, 2, expect.any(Object));
      expect(lines).toHaveLength(5);
      expect(lines[0]).toEqual({
        time: 0,
        isMeasure: true,
        isBeat: true,
        measureIndex: 0,
        beatIndex: 0,
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format time as MBT when BPM is available', () => {
      (formatAsMeasureBeat as any).mockReturnValue('1.1');

      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
        })
      );

      const formatted = result.current.formatTime(0.5);

      expect(formatAsMeasureBeat).toHaveBeenCalledWith(0.5, 120, 4);
      expect(formatted).toBe('1.1');
    });

    it('should format time as seconds when BPM is not available', () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
          defaultBPM: 0, // No BPM
        })
      );

      const formatted = result.current.formatTime(1.234);

      expect(formatted).toBe('1.23');
    });
  });

  describe('Snap Division', () => {
    it('should update snap division', () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
          snapDivision: 4,
        })
      );

      result.current.setSnapDivision(8);

      expect(result.current.snapOptions.snapDivision).toBe(8);
    });

    it('should use correct snap division in snap calls', () => {
      const { result, rerender } = renderHook(
        ({ snapDivision }) =>
          useBPMGrid({
            duration: mockDuration,
            snapDivision,
          }),
        { initialProps: { snapDivision: 4 } }
      );

      // Call snap with division 4
      result.current.snap(1);

      // Update snap division
      rerender({ snapDivision: 8 });

      // Should use new division
      result.current.snap(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null audio URL', () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          duration: mockDuration,
        })
      );

      expect(result.current.bpm).toBe(120); // Default BPM
      expect(result.current.isDetectingBPM).toBe(false);
    });

    it('should handle zero duration', () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          duration: 0,
        })
      );

      expect(result.current.bpm).toBe(120);
    });

    it('should handle very long audio tracks', () => {
      const { result } = renderHook(() =>
        useBPMGrid({
          duration: 3600, // 1 hour
        })
      );

      expect(result.current.bpm).toBe(120);
    });
  });
});
