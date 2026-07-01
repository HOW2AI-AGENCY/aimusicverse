/**
 * usePromptDecks — внутренний хук PromptDJ.
 *
 * Owns the "deck" state slice:
 * - channels (9-knob grid: genre/instrument/mood/energy/texture/style/vocal/tempo/custom)
 * - globalSettings (BPM, key, scale, density, brightness, duration)
 * - memoised `currentPrompt` from buildWeightedPrompt(channels, globalSettings)
 *
 * Provides debounced updateers for smooth knob interaction (~60fps).
 * The real-time Tone effects (BPM ramp, brightness osc type, filter,
 * reverb wet, scale notes, pattern regen) are wired by usePromptEffects,
 * which reads from this hook's return value.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042 / Task B2
 * (god-hook декомпозиция 879 → <500 LOC).
 */

import { useCallback, useMemo, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { buildWeightedPrompt } from "./promptBuilder";
import { DEFAULT_CHANNELS, DEFAULT_SETTINGS } from "./defaults";
import type { GlobalSettings, PromptChannel } from "./types";

export interface UsePromptDecksResult {
  channels: PromptChannel[];
  updateChannel: (id: string, updates: Partial<PromptChannel>) => void;
  globalSettings: GlobalSettings;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => void;
  /** Memoised prompt string derived from current channels + settings. */
  currentPrompt: string;
  /** Pending flag from useTransition — true while debounced updates flush. */
  isPending: boolean;
}

export function usePromptDecks(): UsePromptDecksResult {
  const [channels, setChannels] = useState<PromptChannel[]>(DEFAULT_CHANNELS);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isPending, startTransition] = useTransition();

  // Debounced channel update for weight changes (smooth knob interaction)
  const debouncedChannelUpdate = useDebouncedCallback(
    (id: string, updates: Partial<PromptChannel>) => {
      startTransition(() => {
        setChannels((prev) => prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)));
      });
    },
    16, // ~60fps
    { leading: true, trailing: true, maxWait: 50 },
  );

  // Update channel - immediate for non-weight, debounced for weight
  const updateChannel = useCallback(
    (id: string, updates: Partial<PromptChannel>) => {
      if ("weight" in updates && Object.keys(updates).length === 1) {
        // Weight-only updates are debounced for smooth knob interaction
        debouncedChannelUpdate(id, updates);
      } else {
        // Other updates are immediate
        setChannels((prev) => prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)));
      }
    },
    [debouncedChannelUpdate],
  );

  // Debounced global settings update for continuous values (BPM, density, brightness)
  const debouncedSettingsUpdate = useDebouncedCallback(
    (updates: Partial<GlobalSettings>) => {
      startTransition(() => {
        setGlobalSettings((prev) => ({ ...prev, ...updates }));
      });
    },
    16,
    { leading: true, trailing: true, maxWait: 50 },
  );

  // Update global settings: debounce continuous values; immediate for discrete
  const updateGlobalSettings = useCallback(
    (updates: Partial<GlobalSettings>) => {
      if ("bpm" in updates || "density" in updates || "brightness" in updates) {
        debouncedSettingsUpdate(updates);
      } else {
        setGlobalSettings((prev) => ({ ...prev, ...updates }));
      }
    },
    [debouncedSettingsUpdate],
  );

  // Memoised weighted prompt string
  const currentPrompt = useMemo(() => buildWeightedPrompt(channels, globalSettings), [channels, globalSettings]);

  return {
    channels,
    updateChannel,
    globalSettings,
    updateGlobalSettings,
    currentPrompt,
    isPending,
  };
}
