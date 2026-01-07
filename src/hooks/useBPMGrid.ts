/**
 * useBPMGrid - Hook for BPM-aware grid and snap-to-grid functionality
 * Provides grid lines, snap functions, and MBT (Measure-Beat-Time) formatting
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { detectBPMFromUrl, type BPMDetectionResult } from '@/lib/audio/bpmDetection';
import {
  snapToGrid,
  generateGridPositions,
  getNearestGridPosition,
  formatAsMeasureBeat,
  type SnapOptions,
  type SnapResult,
} from '@/lib/audio/beatSnap';

export interface GridLine {
  time: number;
  isMeasure: boolean;
  isBeat: boolean;
  measureIndex: number;
  beatIndex: number;
}

export interface UseBPMGridOptions {
  /**
   * Audio URL for BPM detection
   */
  audioUrl?: string;

  /**
   * Duration of the audio in seconds
   */
  duration: number;

  /**
   * Default BPM if detection fails
   * @default 120
   */
  defaultBPM?: number;

  /**
   * Snap division (1 = whole note, 2 = half note, 4 = quarter note, etc.)
   * @default 4
   */
  snapDivision?: 1 | 2 | 4 | 8 | 16 | 32;

  /**
   * Time signature (beats per measure)
   * @default 4
   */
  timeSignature?: number;

  /**
   * Zoom level (affects grid line visibility)
   * @default 50
   */
  zoom?: number;
}

export interface UseBPMGridReturn {
  /**
   * Detected BPM (or default if detection failed/pending)
   */
  bpm: number | null;

  /**
   * BPM detection result (includes confidence)
   */
  bpmResult: BPMDetectionResult | null;

  /**
   * Whether BPM detection is in progress
   */
  isDetectingBPM: boolean;

  /**
   * Current snap options
   */
  snapOptions: SnapOptions;

  /**
   * Snap a time position to the nearest grid line
   */
  snap: (time: number) => SnapResult;

  /**
   * Get the nearest grid position to a time
   */
  getNearestGrid: (time: number) => number;

  /**
   * Get grid lines for a time range
   */
  getGridLines: (startTime: number, endTime: number) => GridLine[];

  /**
   * Format time as MBT (Measure-Beat) or seconds
   */
  formatTime: (time: number) => string;

  /**
   * Update snap division
   */
  setSnapDivision: (division: 1 | 2 | 4 | 8 | 16 | 32) => void;

  /**
   * Manually set BPM (overrides detection)
   */
  setBPM: (bpm: number) => void;
}

/**
 * Hook for BPM-aware grid and snap-to-grid functionality
 *
 * @param options - Grid options
 * @returns Grid functions and state
 *
 * @example
 * ```tsx
 * const { bpm, snap, getGridLines, formatTime } = useBPMGrid({
 *   audioUrl: track.audio_url,
 *   duration: track.duration,
 *   snapDivision: 4,
 * });
 *
 * // Snap a time to grid
 * const snapped = snap(1.3);
 * console.log(snapped.snappedTime); // 1.5 (nearest quarter note)
 *
 * // Get grid lines for rendering
 * const lines = getGridLines(0, 10);
 * ```
 */
export function useBPMGrid(options: UseBPMGridOptions): UseBPMGridReturn {
  const {
    audioUrl,
    duration,
    defaultBPM = 120,
    snapDivision = 4,
    timeSignature = 4,
    zoom = 50,
  } = options;

  // BPM detection state
  const [bpmResult, setBpmResult] = useState<BPMDetectionResult | null>(null);
  const [isDetectingBPM, setIsDetectingBPM] = useState(false);
  const [manualBPM, setManualBPM] = useState<number | null>(null);

  // Snap division state
  const [currentSnapDivision, setCurrentSnapDivision] = useState(snapDivision);

  // Detect BPM from audio URL
  useEffect(() => {
    if (!audioUrl || manualBPM !== null) return;

    let aborted = false;

    const detect = async () => {
      setIsDetectingBPM(true);
      try {
        const result = await detectBPMFromUrl(audioUrl);
        if (!aborted && result) {
          setBpmResult(result);
        }
      } catch (error) {
        console.error('BPM detection failed:', error);
      } finally {
        if (!aborted) {
          setIsDetectingBPM(false);
        }
      }
    };

    detect();

    return () => {
      aborted = true;
    };
  }, [audioUrl, manualBPM]);

  // Current BPM (detected, manual, or default)
  const bpm = useMemo(() => {
    if (manualBPM !== null) return manualBPM;
    if (bpmResult !== null) return bpmResult.bpm;
    return defaultBPM;
  }, [manualBPM, bpmResult, defaultBPM]);

  // Snap options
  const snapOptions = useMemo<SnapOptions>(
    () => ({
      bpm,
      snapDivision: currentSnapDivision,
      timeSignature,
    }),
    [bpm, currentSnapDivision, timeSignature]
  );

  // Snap function
  const snap = useCallback(
    (time: number) => {
      return snapToGrid(time, snapOptions);
    },
    [snapOptions]
  );

  // Get nearest grid position
  const getNearestGrid = useCallback(
    (time: number) => {
      return getNearestGridPosition(time, snapOptions);
    },
    [snapOptions]
  );

  // Get grid lines for a time range
  const getGridLines = useCallback(
    (startTime: number, endTime: number): GridLine[] => {
      const positions = generateGridPositions(startTime, endTime, snapOptions);

      return positions.map((time) => {
        const result = snapToGrid(time, snapOptions);
        return {
          time: result.snappedTime,
          isMeasure: result.beatIndex % timeSignature === 0,
          isBeat: true,
          measureIndex: result.measureIndex,
          beatIndex: result.beatIndex,
        };
      });
    },
    [snapOptions, timeSignature]
  );

  // Format time as MBT or seconds
  const formatTime = useCallback(
    (time: number): string => {
      if (!bpm) {
        return time.toFixed(2);
      }
      return formatAsMeasureBeat(time, bpm, timeSignature);
    },
    [bpm, timeSignature]
  );

  // Update snap division
  const setSnapDivision = useCallback((division: 1 | 2 | 4 | 8 | 16 | 32) => {
    setCurrentSnapDivision(division);
  }, []);

  // Manually set BPM
  const handleSetBPM = useCallback((newBpm: number) => {
    setManualBPM(newBpm);
    setBpmResult({
      bpm: newBpm,
      offset: 0,
      confidence: 1.0,
    });
  }, []);

  return {
    bpm,
    bpmResult,
    isDetectingBPM,
    snapOptions,
    snap,
    getNearestGrid,
    getGridLines,
    formatTime,
    setSnapDivision,
    setBPM: handleSetBPM,
  };
}

export default useBPMGrid;
