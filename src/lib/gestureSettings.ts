import type { GestureSettings } from "@/types/gestures";
import { GestureSettingsSchema } from "@/lib/validation/gestures-schema";

const STORAGE_KEY = "musicverse-gestures";

export const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  doubleTapSeek: { enabled: true, seekAmount: 10, leftSideEnabled: true, rightSideEnabled: true },
  horizontalSwipe: { enabled: true, threshold: 80, velocityThreshold: 400 },
  hintOverlay: { shown: false, dismissed: false },
  keyboard: { enabled: true, seekAmount: 10 },
  version: 1,
  lastUpdated: Date.now(),
};

export function loadGestureSettings(): GestureSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
    const parsed = JSON.parse(raw);
    const result = GestureSettingsSchema.safeParse(parsed);
    return result.success ? result.data : { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
  } catch {
    return { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
  }
}

export function saveGestureSettings(settings: GestureSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, lastUpdated: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}
