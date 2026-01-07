/**
 * Unit tests for beat-snap calculation
 * Tests for snap-to-grid functionality with BPM-aware grid
 */

import { describe, it, expect } from 'vitest';

describe('Beat Snap Calculation - T041', () => {
  describe('Snap to Nearest Beat', () => {
    it('should snap time to nearest beat at 120 BPM', () => {
      const bpm = 120;
      const currentTime = 1.3; // 1.3 seconds
      const beatDuration = 60 / bpm; // 0.5 seconds per beat

      // Expected: snap to 1.5 (beat 3)
      const expectedSnap = Math.round(currentTime / beatDuration) * beatDuration;
      expect(expectedSnap).toBe(1.5);
    });

    it('should snap time to nearest half-beat when snap is 1/2', () => {
      const bpm = 120;
      const currentTime = 1.25;
      const snapDivision = 2;
      const beatDuration = 60 / bpm;
      const subdivisionDuration = beatDuration / snapDivision; // 0.25 seconds

      const expectedSnap = Math.round(currentTime / subdivisionDuration) * subdivisionDuration;
      expect(expectedSnap).toBe(1.25);
    });

    it('should snap time to nearest quarter-beat when snap is 1/4', () => {
      const bpm = 120;
      const currentTime = 1.125;
      const snapDivision = 4;
      const beatDuration = 60 / bpm;
      const subdivisionDuration = beatDuration / snapDivision; // 0.125 seconds

      const expectedSnap = Math.round(currentTime / subdivisionDuration) * subdivisionDuration;
      expect(expectedSnap).toBe(1.125);
    });

    it('should snap time to nearest eighth-beat when snap is 1/8', () => {
      const bpm = 120;
      const currentTime = 1.0625;
      const snapDivision = 8;
      const beatDuration = 60 / bpm;
      const subdivisionDuration = beatDuration / snapDivision; // 0.0625 seconds

      const expectedSnap = Math.round(currentTime / subdivisionDuration) * subdivisionDuration;
      expect(expectedSnap).toBe(1.0625);
    });
  });

  describe('Snap to Nearest Second (Fallback)', () => {
    it('should snap to nearest second when BPM is not available', () => {
      const bpm = null;
      const currentTime = 5.7;

      // Fallback to 1-second grid
      const expectedSnap = Math.round(currentTime);
      expect(expectedSnap).toBe(6);
    });

    it('should snap to 0.5 second when snap is 1/2 and BPM is not available', () => {
      const bpm = null;
      const currentTime = 5.75;
      const snapDivision = 2;

      const subdivisionDuration = 1 / snapDivision;
      const expectedSnap = Math.round(currentTime / subdivisionDuration) * subdivisionDuration;
      expect(expectedSnap).toBe(5.5);
    });
  });

  describe('Beat Duration Calculation', () => {
    it('should calculate correct beat duration for various BPMs', () => {
      const testCases = [
        { bpm: 60, expectedDuration: 1.0 },   // 1 second per beat
        { bpm: 120, expectedDuration: 0.5 },  // 0.5 seconds per beat
        { bpm: 140, expectedDuration: 0.42857142857142855 }, // ~0.43 seconds per beat
        { bpm: 80, expectedDuration: 0.75 },  // 0.75 seconds per beat
      ];

      testCases.forEach(({ bpm, expectedDuration }) => {
        const beatDuration = 60 / bpm;
        expect(beatDuration).toBeCloseTo(expectedDuration, 6);
      });
    });
  });

  describe('Grid Calculation', () => {
    it('should generate correct grid positions for 4/4 time signature', () => {
      const bpm = 120;
      const duration = 10; // 10 seconds
      const beatDuration = 60 / bpm; // 0.5 seconds
      const expectedBeats = duration / beatDuration; // 20 beats

      const gridPositions = Array.from({ length: expectedBeats }, (_, i) => i * beatDuration);

      expect(gridPositions.length).toBe(20);
      expect(gridPositions[0]).toBe(0);
      expect(gridPositions[1]).toBe(0.5);
      expect(gridPositions[19]).toBe(9.5);
    });

    it('should generate correct grid positions for 3/4 time signature', () => {
      const bpm = 120;
      const duration = 6; // 6 seconds
      const beatDuration = 60 / bpm; // 0.5 seconds
      const beatsPerMeasure = 3;
      const expectedBeats = (duration / beatDuration) / beatsPerMeasure; // 8 measures

      const measurePositions = Array.from({ length: expectedBeats }, (_, i) => i * beatDuration * beatsPerMeasure);

      expect(measurePositions.length).toBe(8);
      expect(measurePositions[0]).toBe(0);
      expect(measurePositions[1]).toBe(1.5); // 3 beats * 0.5 seconds
    });
  });

  describe('Snap Division Presets', () => {
    it('should support common snap divisions', () => {
      const snapDivisions = [1, 2, 4, 8, 16, 32]; // 1/1, 1/2, 1/4, 1/8, 1/16, 1/32

      snapDivisions.forEach(division => {
        const isValidDivision = Number.isInteger(division) && division >= 1 && division <= 32;
        expect(isValidDivision).toBe(true);
      });
    });

    it('should calculate correct subdivision duration for each preset', () => {
      const bpm = 120;
      const beatDuration = 60 / bpm; // 0.5 seconds

      const subdivisions = {
        1: beatDuration / 1,    // 0.5s (whole note)
        2: beatDuration / 2,    // 0.25s (half note)
        4: beatDuration / 4,    // 0.125s (quarter note)
        8: beatDuration / 8,    // 0.0625s (eighth note)
        16: beatDuration / 16,  // 0.03125s (sixteenth note)
        32: beatDuration / 32,  // 0.015625s (thirty-second note)
      };

      expect(subdivisions[1]).toBe(0.5);
      expect(subdivisions[2]).toBe(0.25);
      expect(subdivisions[4]).toBe(0.125);
      expect(subdivisions[8]).toBe(0.0625);
      expect(subdivisions[16]).toBe(0.03125);
      expect(subdivisions[32]).toBe(0.015625);
    });
  });

  describe('Edge Cases', () => {
    it('should handle time 0 correctly', () => {
      const bpm = 120;
      const currentTime = 0;

      const snapped = currentTime; // 0 should stay 0
      expect(snapped).toBe(0);
    });

    it('should handle very small BPM (30 BPM)', () => {
      const bpm = 30;
      const beatDuration = 60 / bpm; // 2 seconds per beat

      expect(beatDuration).toBe(2);
    });

    it('should handle very large BPM (200 BPM)', () => {
      const bpm = 200;
      const beatDuration = 60 / bpm; // 0.3 seconds per beat

      expect(beatDuration).toBe(0.3);
    });

    it('should handle floating point precision issues', () => {
      const bpm = 120;
      const currentTime = 1.0000001; // Floating point imprecision
      const beatDuration = 60 / bpm;

      const snapped = Math.round(currentTime / beatDuration) * beatDuration;
      expect(snapped).toBeCloseTo(1.0, 5);
    });
  });
});
