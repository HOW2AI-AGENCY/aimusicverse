/**
 * Unit tests for lib/chord-data.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { normalizeChord, getChordFingering, hasChordFingering, getAllChords, getChordsByType } from "@/lib/chord-data";

describe("normalizeChord", () => {
  it("returns C for C major", () => {
    expect(normalizeChord("C")).toBe("C");
  });

  it("keeps Cm as Cm", () => {
    expect(normalizeChord("Cm")).toBe("Cm");
  });

  it("keeps original chord if not in dictionary", () => {
    expect(normalizeChord("Cmajor")).toBe("Cmajor");
  });

  it("keeps lowercase if not in dictionary", () => {
    expect(normalizeChord("c")).toBe("c");
  });

  it("handles empty string", () => {
    expect(normalizeChord("")).toBe("");
  });
});

describe("getChordFingering", () => {
  it("returns fingering for known chord", () => {
    const result = getChordFingering("C");
    expect(result).not.toBeNull();
    expect(result?.positions).toBeDefined();
  });

  it("returns null for unknown chord", () => {
    expect(getChordFingering("Xm7b5")).toBeNull();
  });
});

describe("hasChordFingering", () => {
  it("returns true for known chord", () => {
    expect(hasChordFingering("C")).toBe(true);
  });

  it("returns false for unknown chord", () => {
    expect(hasChordFingering("Xm7b5")).toBe(false);
  });
});

describe("getAllChords", () => {
  it("returns non-empty array", () => {
    const chords = getAllChords();
    expect(chords.length).toBeGreaterThan(0);
  });

  it("includes common chords", () => {
    const chords = getAllChords();
    expect(chords).toContain("C");
    expect(chords).toContain("G");
    expect(chords).toContain("Am");
  });
});

describe("getChordsByType", () => {
  it("returns major chords", () => {
    const majors = getChordsByType("major");
    expect(majors.length).toBeGreaterThan(0);
    expect(majors).toContain("C");
  });

  it("returns minor chords", () => {
    const minors = getChordsByType("minor");
    expect(minors.length).toBeGreaterThan(0);
    expect(minors).toContain("Am");
  });

  it("returns 7th chords", () => {
    const sevenths = getChordsByType("7th");
    expect(sevenths.length).toBeGreaterThan(0);
  });
});
