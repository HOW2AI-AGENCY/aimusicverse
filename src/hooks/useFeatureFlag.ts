/**
 * useFeatureFlag Hook
 *
 * Simple hook for reading feature flags with localStorage override support.
 * Used for gradual rollout of new features.
 */

import { useMemo } from "react";

interface FeatureFlagConfig {
  default: boolean;
  storageKey: string;
  environments: {
    dev: number | boolean;
    staging: number | boolean;
    prod: number | boolean | { start: number; rampTo: number; rampDays: number };
  };
}

export function useFeatureFlag(storageKey: string, defaultValue: boolean = false): boolean {
  return useMemo(() => {
    // Check localStorage override first
    if (typeof window !== "undefined") {
      const override = localStorage.getItem(storageKey);
      if (override !== null) {
        return override === "true" || override === "1";
      }
    }

    // Fall back to default
    return defaultValue;
  }, [storageKey, defaultValue]);
}
