import { vi, describe, it, expect } from "vitest";
vi.mock("tone", () => ({}));
import { drumKits, getKitById, presetPatterns, type DrumKit, type DrumSound, type DrumPattern } from "./drum-kits";

// ──────────────────────────────────────────────────
// drumKits — 6 kits × 8 sounds, structural integrity
// ──────────────────────────────────────────────────
describe("drumKits", () => {
  it("exports exactly 6 kits", () => {
    expect(drumKits).toHaveLength(6);
  });

  it("each kit has required fields", () => {
    const requiredFields: (keyof DrumKit)[] = ["id", "name", "icon", "description", "sounds"];
    for (const kit of drumKits) {
      for (const field of requiredFields) {
        expect(kit).toHaveProperty(field);
      }
    }
  });

  it("each kit has a unique id", () => {
    const ids = drumKits.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each kit has exactly 8 sounds", () => {
    for (const kit of drumKits) {
      expect(kit.sounds).toHaveLength(8);
    }
  });

  it("each sound has valid structure", () => {
    const validTypes = ["membrane", "metal", "noise", "synth"];
    for (const kit of drumKits) {
      for (const sound of kit.sounds) {
        expect(sound).toHaveProperty("id");
        expect(sound).toHaveProperty("name");
        expect(sound).toHaveProperty("shortName");
        expect(sound).toHaveProperty("color");
        expect(validTypes).toContain(sound.type);
        expect(sound).toHaveProperty("params");
      }
    }
  });

  it("each kit has unique sound ids within itself", () => {
    for (const kit of drumKits) {
      const ids = kit.sounds.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("each sound has non-empty params object", () => {
    for (const kit of drumKits) {
      for (const sound of kit.sounds) {
        expect(Object.keys(sound.params).length).toBeGreaterThan(0);
      }
    }
  });
});

// ──────────────────────────────────────────────────
// getKitById
// ──────────────────────────────────────────────────
describe("getKitById", () => {
  it("returns correct kit for known ids", () => {
    const knownIds = ["808", "909", "acoustic", "lofi", "trap", "ethnic"];
    for (const id of knownIds) {
      const kit = getKitById(id);
      expect(kit).toBeDefined();
      if (kit) {
        expect(kit.id).toBe(id);
      }
    }
  });

  it("returns undefined for nonexistent id", () => {
    expect(getKitById("nonexistent")).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────
// presetPatterns — 12 patterns
// ──────────────────────────────────────────────────
describe("presetPatterns", () => {
  it("exports exactly 12 patterns", () => {
    expect(presetPatterns).toHaveLength(12);
  });

  it("each pattern has required fields", () => {
    const requiredFields: (keyof DrumPattern)[] = ["id", "name", "genre", "bpm", "steps"];
    for (const pattern of presetPatterns) {
      for (const field of requiredFields) {
        expect(pattern).toHaveProperty(field);
      }
    }
  });

  it("each pattern has a unique id", () => {
    const ids = presetPatterns.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each pattern has a positive bpm", () => {
    for (const pattern of presetPatterns) {
      expect(pattern.bpm).toBeGreaterThan(0);
    }
  });

  it("each pattern has 16-step sequences", () => {
    for (const pattern of presetPatterns) {
      for (const [soundId, steps] of Object.entries(pattern.steps)) {
        expect(steps).toHaveLength(16);
        for (const step of steps) {
          expect(typeof step).toBe("boolean");
        }
      }
    }
  });

  it("patterns cover various genres", () => {
    const genreSet = new Set(presetPatterns.map((p) => p.genre));
    expect(genreSet.size).toBeGreaterThanOrEqual(6);
  });
});
