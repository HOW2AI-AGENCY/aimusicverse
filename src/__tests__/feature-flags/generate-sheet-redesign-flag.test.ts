import { describe, it, expect } from "vitest";
import { GENERATE_SHEET_REDESIGN_ENABLED } from "@/lib/feature-flags";

describe("GENERATE_SHEET_REDESIGN_ENABLED flag", () => {
  it("has a stable storage key", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.storageKey).toBe("ff.generate-sheet-redesign");
  });

  it("defaults to false in prod", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.default).toBe(false);
  });

  it("rolls out gradually in prod (start <= rampTo)", () => {
    const prod = GENERATE_SHEET_REDESIGN_ENABLED.environments.prod as {
      start: number;
      rampTo: number;
      rampDays: number;
    };
    expect(prod.start).toBeLessThanOrEqual(prod.rampTo);
    expect(prod.rampDays).toBeGreaterThanOrEqual(3);
  });

  it("is fully on in dev and staging", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.environments.dev).toBe(1);
    expect(GENERATE_SHEET_REDESIGN_ENABLED.environments.staging).toBe(1);
  });
});
