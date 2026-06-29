/**
 * Preferences Store (T006)
 * Two slices: UserPreferences + GestureConfig
 * Triple persistence: Zustand → localStorage → Telegram CloudStorage
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GestureConfigSchema,
  UserPreferencesSchema,
  DEFAULT_GESTURE_CONFIG,
  DEFAULT_USER_PREFERENCES,
} from "@/lib/schemas/preferences.schema";
import type { GestureConfig, UserPreferences } from "@/lib/schemas/preferences.schema";
import { logger } from "@/lib/logger";

// --- Telegram CloudStorage helpers ---

function cloudStorageSet(key: string, value: string): void {
  try {
    window.Telegram?.WebApp?.CloudStorage?.setItem(key, value, (err: Error | null) => {
      if (err) logger.warn("CloudStorage write failed", { key, err });
    });
  } catch {
    // CloudStorage not available
  }
}

function cloudStorageGet(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      window.Telegram?.WebApp?.CloudStorage?.getItem(
        key,
        (err: Error | null, value: string | null) => {
          if (err || value === undefined || value === null || value === "") resolve(null);
          else resolve(value);
        },
      );
      // Timeout fallback
      setTimeout(() => resolve(null), 2000);
    } catch {
      resolve(null);
    }
  });
}

// --- Store types ---

interface PreferencesState {
  preferences: UserPreferences;
  gestureConfig: GestureConfig;

  // Preference actions
  setTheme: (theme: UserPreferences["theme"]) => void;
  setTextSize: (size: UserPreferences["textSize"]) => void;
  setReducedMotion: (val: boolean) => void;
  setAudioQuality: (q: UserPreferences["audioQuality"]) => void;
  setNotificationsEnabled: (val: boolean) => void;
  setCompactCards: (val: boolean) => void;
  resetPreferences: () => void;

  // Gesture actions
  setGestureConfig: (partial: Partial<GestureConfig>) => void;
  resetGestureConfig: () => void;
}

// --- Sync to CloudStorage after state changes ---

function syncToCloud(state: PreferencesState): void {
  cloudStorageSet("prefs", JSON.stringify(state.preferences));
  cloudStorageSet("gestures", JSON.stringify(state.gestureConfig));
}

// --- Parse with validation ---

function parsePreferences(raw: unknown): UserPreferences {
  const result = UserPreferencesSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_USER_PREFERENCES;
}

function parseGestureConfig(raw: unknown): GestureConfig {
  const result = GestureConfigSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_GESTURE_CONFIG;
}

// --- Store ---

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_USER_PREFERENCES,
      gestureConfig: DEFAULT_GESTURE_CONFIG,

      // Preference actions
      setTheme: (theme) => {
        set((s) => ({ preferences: { ...s.preferences, theme } }));
        syncToCloud(get());
      },
      setTextSize: (size) => {
        set((s) => ({ preferences: { ...s.preferences, textSize: size } }));
        syncToCloud(get());
      },
      setReducedMotion: (val) => {
        set((s) => ({ preferences: { ...s.preferences, reducedMotion: val } }));
        syncToCloud(get());
      },
      setAudioQuality: (q) => {
        set((s) => ({ preferences: { ...s.preferences, audioQuality: q } }));
        syncToCloud(get());
      },
      setNotificationsEnabled: (val) => {
        set((s) => ({ preferences: { ...s.preferences, notificationsEnabled: val } }));
        syncToCloud(get());
      },
      setCompactCards: (val) => {
        set((s) => ({ preferences: { ...s.preferences, compactCards: val } }));
        syncToCloud(get());
      },
      resetPreferences: () => {
        set({ preferences: DEFAULT_USER_PREFERENCES });
        syncToCloud(get());
      },

      // Gesture actions
      setGestureConfig: (partial) => {
        set((s) => ({
          gestureConfig: parseGestureConfig({ ...s.gestureConfig, ...partial }),
        }));
        syncToCloud(get());
      },
      resetGestureConfig: () => {
        set({ gestureConfig: DEFAULT_GESTURE_CONFIG });
        syncToCloud(get());
      },
    }),
    {
      name: "user-preferences",
      partialize: (state) => ({
        preferences: state.preferences,
        gestureConfig: state.gestureConfig,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<PreferencesState, "preferences" | "gestureConfig">>;
        return {
          ...current,
          preferences: parsePreferences(p?.preferences),
          gestureConfig: parseGestureConfig(p?.gestureConfig),
        };
      },
    },
  ),
);

// --- Async CloudStorage merge on init ---

async function mergeFromCloudStorage(): Promise<void> {
  try {
    const [prefsRaw, gesturesRaw] = await Promise.all([
      cloudStorageGet("prefs"),
      cloudStorageGet("gestures"),
    ]);

    if (!prefsRaw && !gesturesRaw) return;

    const store = usePreferencesStore.getState();
    const updates: Partial<Pick<PreferencesState, "preferences" | "gestureConfig">> = {};

    if (prefsRaw) {
      const cloud = parsePreferences(JSON.parse(prefsRaw));
      // Cloud wins if localStorage had defaults (i.e. fresh install)
      const isDefault =
        JSON.stringify(store.preferences) === JSON.stringify(DEFAULT_USER_PREFERENCES);
      if (isDefault) updates.preferences = cloud;
    }

    if (gesturesRaw) {
      const cloud = parseGestureConfig(JSON.parse(gesturesRaw));
      const isDefault =
        JSON.stringify(store.gestureConfig) === JSON.stringify(DEFAULT_GESTURE_CONFIG);
      if (isDefault) updates.gestureConfig = cloud;
    }

    if (Object.keys(updates).length > 0) {
      usePreferencesStore.setState(updates);
      logger.info("Merged preferences from CloudStorage", { keys: Object.keys(updates) });
    }
  } catch (err) {
    logger.warn("Failed to merge CloudStorage preferences", { err });
  }
}

// Trigger async merge after hydration
if (typeof window !== "undefined") {
  // Small delay to let persist middleware hydrate from localStorage first
  setTimeout(mergeFromCloudStorage, 500);
}
