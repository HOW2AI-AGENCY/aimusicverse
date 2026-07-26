/**
 * Unit tests for stem realtime volume/mute/solo logic.
 *
 * Tests the effective volume calculation logic extracted from StudioShell:
 *   muted → volume=0
 *   hasAnySolo && !track.solo → volume=0
 *   otherwise → track.volume
 */
import { describe, it, expect } from "vitest";

type Track = { id: string; volume: number; muted: boolean; solo: boolean };

function computeEffectiveVolumes(tracks: Track[]): Record<string, number> {
  const hasAnySolo = tracks.some((t) => t.solo);
  const result: Record<string, number> = {};
  for (const t of tracks) {
    result[t.id] = t.muted ? 0 : hasAnySolo && !t.solo ? 0 : t.volume;
  }
  return result;
}

describe("effective volume calculation (mute/solo)", () => {
  it("should return track.volume when no mutes or solos", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: false, solo: false },
      { id: "t2", volume: 0.9, muted: false, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0.8);
    expect(volumes.t2).toBe(0.9);
  });

  it("should set volume to 0 for muted tracks", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: true, solo: false },
      { id: "t2", volume: 0.9, muted: false, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0);
    expect(volumes.t2).toBe(0.9);
  });

  it("should mute all non-solo tracks when one track is soloed", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: false, solo: true },
      { id: "t2", volume: 0.9, muted: false, solo: false },
      { id: "t3", volume: 0.7, muted: false, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0.8); // soloed — keeps its volume
    expect(volumes.t2).toBe(0);   // non-solo → 0
    expect(volumes.t3).toBe(0);   // non-solo → 0
  });

  it("should mute everything when multiple tracks are soloed and non-soloed exist", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: false, solo: true },
      { id: "t2", volume: 0.9, muted: false, solo: true },
      { id: "t3", volume: 0.7, muted: false, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0.8);
    expect(volumes.t2).toBe(0.9);
    expect(volumes.t3).toBe(0);
  });

  it("should treat muted+soloed track as muted (muted wins) — and non-soloed tracks also mute", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: true, solo: true },
      { id: "t2", volume: 0.9, muted: false, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0);  // muted wins over solo
    expect(volumes.t2).toBe(0);  // non-solo muted because t1 is soloed
  });

  it("should handle all muted — everything is 0", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.8, muted: true, solo: false },
      { id: "t2", volume: 0.9, muted: true, solo: false },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0);
    expect(volumes.t2).toBe(0);
  });

  it("should handle empty track list", () => {
    const volumes = computeEffectiveVolumes([]);
    expect(Object.keys(volumes)).toHaveLength(0);
  });

  it("should handle single track with solo (no-op since nothing to mute)", () => {
    const tracks: Track[] = [
      { id: "t1", volume: 0.5, muted: false, solo: true },
    ];

    const volumes = computeEffectiveVolumes(tracks);

    expect(volumes.t1).toBe(0.5);
  });
});
