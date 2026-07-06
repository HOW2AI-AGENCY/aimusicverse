/**
 * Unit tests for analysis.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi } from "vitest";
import {
  midiToNoteName,
  detectKey,
  detectBPM,
  generateTagsFromAnalysis,
} from "@/services/analysis.service";
import type { NoteData, MelodyAnalysisResult } from "@/services/analysis.service";

vi.mock("@/api/analysis.api", () => ({}));

describe("analysis.service", () => {
  describe("midiToNoteName", () => {
    it("converts MIDI 60 to C4", () => {
      expect(midiToNoteName(60)).toBe("C4");
    });

    it("converts MIDI 69 to A4", () => {
      expect(midiToNoteName(69)).toBe("A4");
    });

    it("converts MIDI 0 to C-1", () => {
      expect(midiToNoteName(0)).toBe("C-1");
    });

    it("converts MIDI 127 to G9", () => {
      expect(midiToNoteName(127)).toBe("G9");
    });

    it("converts MIDI 61 to C#4", () => {
      expect(midiToNoteName(61)).toBe("C#4");
    });
  });

  describe("detectKey", () => {
    it("detects key from notes", () => {
      const notes: NoteData[] = [
        { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80, noteName: "C4" },
        { pitch: 62, startTime: 0.5, endTime: 1, velocity: 80, noteName: "D4" },
        { pitch: 64, startTime: 1, endTime: 1.5, velocity: 80, noteName: "E4" },
        { pitch: 65, startTime: 1.5, endTime: 2, velocity: 80, noteName: "F4" },
        { pitch: 67, startTime: 2, endTime: 2.5, velocity: 80, noteName: "G4" },
        { pitch: 69, startTime: 2.5, endTime: 3, velocity: 80, noteName: "A4" },
        { pitch: 71, startTime: 3, endTime: 3.5, velocity: 80, noteName: "B4" },
      ];

      const key = detectKey(notes);
      // Returns format like "C major" or "A minor"
      expect(key).toMatch(/major|minor/);
    });

    it("returns a string for empty notes", () => {
      const key = detectKey([]);
      expect(typeof key).toBe("string");
    });
  });

  describe("detectBPM", () => {
    it("returns a positive number", () => {
      const notes: NoteData[] = [
        { pitch: 60, startTime: 0, endTime: 0.25, velocity: 80, noteName: "C4" },
        { pitch: 60, startTime: 0.5, endTime: 0.75, velocity: 80, noteName: "C4" },
        { pitch: 60, startTime: 1, endTime: 1.25, velocity: 80, noteName: "C4" },
      ];

      const bpm = detectBPM(notes);
      expect(bpm).toBeGreaterThan(0);
    });

    it("returns default BPM for empty notes", () => {
      const bpm = detectBPM([]);
      expect(bpm).toBeGreaterThan(0);
    });
  });

  describe("generateTagsFromAnalysis", () => {
    it("generates tags from analysis", () => {
      const analysis = {
        notes: [{ pitch: 60, startTime: 0, endTime: 0.5, velocity: 80, noteName: "C4" }],
        chords: [{ chord: "C", startTime: 0, endTime: 1 }],
        bpm: 120,
        key: "C major",
        timeSignature: "4/4",
      };

      const tags = generateTagsFromAnalysis(analysis);

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    it("includes BPM-based tag", () => {
      const analysis = {
        notes: [],
        chords: [],
        bpm: 140,
        key: "A minor",
        timeSignature: "4/4",
      };

      const tags = generateTagsFromAnalysis(analysis);
      expect(tags.some((t) => t.includes("fast") || t.includes("upbeat") || t.includes("tempo"))).toBe(true);
    });
  });
});
