/**
 * Beat Snap Utilities
 * Calculate snap-to-grid positions based on BPM and time signature
 */

import { bpmToBeatDuration } from './bpmDetection';

export type SnapDivision = 1 | 2 | 4 | 8 | 16 | 32;

export interface SnapOptions {
  /**
   * BPM of the track
   * If null, falls back to 1-second grid
   */
  bpm: number | null;

  /**
   * Snap division (1 = whole note, 2 = half note, 4 = quarter note, etc.)
   * @default 4
   */
  snapDivision?: SnapDivision;

  /**
   * Time signature (beats per measure)
   * @default 4
   */
  timeSignature?: number;
}

export interface SnapResult {
  /**
   * Snapped time position
   */
  snappedTime: number;

  /**
   * Beat index (0-based) of the snapped position
   */
  beatIndex: number;

  /**
   * Measure index (0-based) of the snapped position
   */
  measureIndex: number;

  /**
   * Grid duration (duration between grid lines)
   */
  gridDuration: number;
}

/**
 * Snap a time position to the nearest beat/subdivision
 * @param time - Time position in seconds
 * @param options - Snap options
 * @returns Snap result with snapped time and metadata
 */
export function snapToGrid(time: number, options: SnapOptions): SnapResult {
  const {
    bpm,
    snapDivision = 4,
    timeSignature = 4,
  } = options;

  // Fallback to 1-second grid if BPM is not available
  if (!bpm || bpm <= 0) {
    return snapToSecondGrid(time, snapDivision);
  }

  const beatDuration = bpmToBeatDuration(bpm);
  const subdivisionDuration = beatDuration / snapDivision;

  // Calculate snapped time
  const snappedTime = Math.round(time / subdivisionDuration) * subdivisionDuration;

  // Calculate beat and measure indices
  const totalSubdivisions = Math.round(snappedTime / subdivisionDuration);
  const beatIndex = Math.floor(totalSubdivisions / snapDivision);
  const measureIndex = Math.floor(beatIndex / timeSignature);

  return {
    snappedTime: Math.max(0, snappedTime),
    beatIndex,
    measureIndex,
    gridDuration: subdivisionDuration,
  };
}

/**
 * Snap to second-based grid (fallback when BPM is not available)
 * @param time - Time position in seconds
 * @param snapDivision - Snap division
 * @returns Snap result
 */
function snapToSecondGrid(time: number, snapDivision: SnapDivision): SnapResult {
  const subdivisionDuration = 1 / snapDivision;
  const snappedTime = Math.round(time / subdivisionDuration) * subdivisionDuration;

  return {
    snappedTime: Math.max(0, snappedTime),
    beatIndex: Math.round(snappedTime),
    measureIndex: Math.floor(snappedTime / 4),
    gridDuration: subdivisionDuration,
  };
}

/**
 * Calculate beat duration from BPM
 * @param bpm - Beats per minute
 * @returns Duration of one beat in seconds
 */
export function getBeatDuration(bpm: number): number {
  return 60 / bpm;
}

/**
 * Calculate subdivision duration from BPM and snap division
 * @param bpm - Beats per minute
 * @param snapDivision - Snap division
 * @returns Duration of one subdivision in seconds
 */
export function getSubdivisionDuration(bpm: number, snapDivision: SnapDivision): number {
  const beatDuration = getBeatDuration(bpm);
  return beatDuration / snapDivision;
}

/**
 * Generate grid positions for a time range
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @param options - Snap options
 * @returns Array of grid positions
 */
export function generateGridPositions(
  startTime: number,
  endTime: number,
  options: SnapOptions
): number[] {
  const {
    bpm,
    snapDivision = 4,
  } = options;

  const gridDuration = bpm
    ? getSubdivisionDuration(bpm, snapDivision)
    : 1 / snapDivision;

  const positions: number[] = [];

  // Start from the first grid position at or after startTime
  let currentPosition = Math.ceil(startTime / gridDuration) * gridDuration;

  while (currentPosition <= endTime) {
    positions.push(currentPosition);
    currentPosition += gridDuration;
  }

  return positions;
}

/**
 * Get the nearest grid position to a given time
 * @param time - Time position in seconds
 * @param options - Snap options
 * @returns Nearest grid position
 */
export function getNearestGridPosition(time: number, options: SnapOptions): number {
  const result = snapToGrid(time, options);
  return result.snappedTime;
}

/**
 * Check if a time position is on a grid line
 * @param time - Time position to check
 * @param options - Snap options
 * @param tolerance - Tolerance in seconds (default: 0.001)
 * @returns True if time is on a grid line
 */
export function isOnGrid(
  time: number,
  options: SnapOptions,
  tolerance: number = 0.001
): boolean {
  const snapped = snapToGrid(time, options);
  return Math.abs(time - snapped.snappedTime) <= tolerance;
}

/**
 * Calculate the measure position from a time position
 * @param time - Time position in seconds
 * @param bpm - Beats per minute
 * @param timeSignature - Beats per measure (default: 4)
 * @returns Measure index and beat index within measure
 */
export function getMeasurePosition(
  time: number,
  bpm: number,
  timeSignature: number = 4
): { measureIndex: number; beatIndex: number } {
  const beatDuration = getBeatDuration(bpm);
  const totalBeats = time / beatDuration;

  const measureIndex = Math.floor(totalBeats / timeSignature);
  const beatIndex = Math.floor(totalBeats % timeSignature);

  return { measureIndex, beatIndex };
}

/**
 * Format time as measure:beat notation
 * @param time - Time position in seconds
 * @param bpm - Beats per minute
 * @param timeSignature - Beats per measure (default: 4)
 * @returns Formatted string (e.g., "1.3" for measure 1, beat 3)
 */
export function formatAsMeasureBeat(
  time: number,
  bpm: number,
  timeSignature: number = 4
): string {
  const { measureIndex, beatIndex } = getMeasurePosition(time, bpm, timeSignature);
  return `${measureIndex + 1}.${beatIndex + 1}`;
}
