/**
 * Feature flags for gradual rollout of new features.
 *
 * Each flag defines:
 *  - `default`: boolean baseline used when no override is present (rollout bucket, localStorage, etc.)
 *  - `storageKey`: stable localStorage key for per-user override (admin panel)
 *  - `environments`: per-environment rollout config
 *      - `dev` / `staging`: 1 (fully on) — feature is observable during development
 *      - `prod`: { start, rampTo, rampDays } — gradual ramp from `start` to `rampTo` over `rampDays` days
 */

export const GENERATE_SHEET_REDESIGN_ENABLED = {
  default: false,
  storageKey: "ff.generate-sheet-redesign",
  environments: {
    dev: 1,
    staging: 1,
    prod: { start: 0.1, rampTo: 1, rampDays: 5 },
  },
} as const;
