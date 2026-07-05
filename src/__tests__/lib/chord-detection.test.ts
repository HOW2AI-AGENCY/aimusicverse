/**
 * Unit tests for lib/chord-detection.ts
 * Sprint 051 — Test Debt
 */
import { describe, it, expect } from "vitest";
import { getChordColor, getChordNotes } from "@/lib/chord-detection";

describe("getChordColor", () => {
  it("returns blue for major chords", () => {
    expect(getChordColor("major")).toContain("200");
  });

  it("returns purple for minor chords", () => {
    expect(getChordColor("minor")).toContain("280");
  });

  it("returns orange for 7th chords", () => {
    expect(getChordColor("7")).toContain("30");
  });

  it("returns green for sus4 chords", () => {
    expect(getChordColor("sus4")).toContain("160");
  });

  it("returns muted for unknown quality", () => {
    expect(getChordColor("unknown" as any)).toContain("muted-foreground");
  });
});

describe("getChordNotes", () => {
  it("returns notes for C major", () => {
    const notes = getChordNotes("C");
    expect(notes).toContain("C");
    expect(notes).toContain("E");
    expect(notes).toContain("G");
  });

  it("returns notes for A minor", () => {
    const notes = getChordNotes("Am");
    expect(notes).toContain("A");
    expect(notes).toContain("C");
    expect(notes).toContain("E");
  });

  it("returns empty array for unknown chord", () => {
    expect(getChordNotes("Xm7b5")).toEqual([]);
  });

  it("returns notes for G7", () => {
    const notes = getChordNotes("G7");
    expect(notes.length).toBeGreaterThan(0);
    expect(notes).toContain("G");
  });
});
