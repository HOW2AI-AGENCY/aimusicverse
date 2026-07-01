/**
 * Unit tests for prompt-dj pure helpers:
 * - buildWeightedPrompt: composes weighted channel strings + global settings
 * - computeScaleNotes: derives MIDI-like note names from key/scale/octave
 *
 * These are pure functions (no React, no Tone.js), so they can be
 * exercised without rendering hooks.
 */

import { describe, it, expect } from "vitest";
import { buildWeightedPrompt, computeScaleNotes } from "@/hooks/prompt-dj/promptBuilder";
import { DEFAULT_CHANNELS, DEFAULT_SETTINGS } from "@/hooks/prompt-dj/defaults";
import type { PromptChannel } from "@/hooks/prompt-dj/types";

describe("buildWeightedPrompt", () => {
  const settings = DEFAULT_SETTINGS;

  it("returns empty-ish string when no channels are enabled", () => {
    const disabled: PromptChannel[] = DEFAULT_CHANNELS.map((c) => ({ ...c, enabled: false }));
    const out = buildWeightedPrompt(disabled, settings);
    // Even with all disabled, BPM + key/scale still appear
    expect(out).toContain("120 BPM");
    expect(out).toContain("C minor");
    expect(out).not.toContain("very ");
    expect(out).not.toContain("subtle ");
  });

  it("prefixes weight > 0.7 channels with 'very '", () => {
    const channels: PromptChannel[] = [{ id: "a", type: "genre", value: "Jazz", weight: 0.9, enabled: true }];
    const out = buildWeightedPrompt(channels, settings);
    expect(out).toMatch(/very jazz/);
  });

  it("prefixes weight <= 0.4 channels with 'subtle '", () => {
    const channels: PromptChannel[] = [{ id: "a", type: "instrument", value: "Piano", weight: 0.3, enabled: true }];
    const out = buildWeightedPrompt(channels, settings);
    expect(out).toMatch(/subtle piano/);
  });

  it("omits weight 0.05 channels (below 0.1 threshold)", () => {
    const channels: PromptChannel[] = [{ id: "a", type: "genre", value: "Rock", weight: 0.05, enabled: true }];
    const out = buildWeightedPrompt(channels, settings);
    expect(out).not.toMatch(/rock/);
  });

  it("ignores disabled channels", () => {
    const channels: PromptChannel[] = [{ id: "a", type: "genre", value: "Rock", weight: 0.9, enabled: false }];
    const out = buildWeightedPrompt(channels, settings);
    expect(out).not.toMatch(/rock/);
  });

  it("ignores empty-value channels", () => {
    const channels: PromptChannel[] = [{ id: "a", type: "genre", value: "", weight: 0.9, enabled: true }];
    const out = buildWeightedPrompt(channels, settings);
    expect(out).not.toMatch(/very/);
  });

  it("includes BPM, key/scale, density and brightness hints", () => {
    const dense: typeof settings = { ...settings, density: 0.9, brightness: 0.1 };
    const out = buildWeightedPrompt(DEFAULT_CHANNELS, dense);
    expect(out).toContain("120 BPM");
    expect(out).toContain("C minor");
    expect(out).toContain("dense");
    expect(out).toContain("warm");
  });

  it("does NOT add density hint when density is mid-range (0.3–0.7)", () => {
    const out = buildWeightedPrompt(DEFAULT_CHANNELS, settings);
    expect(out).not.toMatch(/sparse|dense/);
    expect(out).not.toMatch(/warm|bright/);
  });
});

describe("computeScaleNotes", () => {
  it("produces 7 notes for a major scale starting on C", () => {
    const notes = computeScaleNotes("C", "major");
    expect(notes).toHaveLength(7);
    expect(notes[0]).toBe("C4");
    // Major intervals from C: C D E F G A B (all natural in this octave)
    expect(notes).toEqual(["C4", "D4", "E4", "F4", "G4", "A4", "B4"]);
  });

  it("produces 7 notes for a minor scale starting on A", () => {
    const notes = computeScaleNotes("A", "minor");
    expect(notes).toHaveLength(7);
    expect(notes[0]).toBe("A4");
  });

  it("handles octave rollover when key + interval exceeds 11", () => {
    // B major → B, C#, D#, E, F#, G#, A# → B4, C#5, D#5, E5, F#5, G#5, A#5
    const notes = computeScaleNotes("B", "major");
    expect(notes[notes.length - 1]).toBe("A#5");
  });

  it("respects a custom octave argument", () => {
    const notes = computeScaleNotes("C", "major", 3);
    expect(notes[0]).toBe("C3");
  });

  it("returns 5 notes for pentatonic scale", () => {
    const notes = computeScaleNotes("C", "pentatonic");
    expect(notes).toHaveLength(5);
  });

  it("falls back to minor intervals for unknown scales", () => {
    const notes = computeScaleNotes("C", "lydian" as unknown as "major");
    expect(notes).toHaveLength(7);
    // Same intervals as minor: [0,2,3,5,7,8,10]
    expect(notes).toEqual(["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4"]);
  });
});
