import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "musicverse_hints_dismissed";

interface HintsState {
  moreMenuHint: boolean;
  gestureHint: boolean;
}

const DEFAULTS: HintsState = { moreMenuHint: false, gestureHint: false };

function loadHints(): HintsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveHints(state: HintsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // unavailable
  }
}

export function useHintDismissal(hintKey: keyof HintsState): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(() => loadHints()[hintKey]);

  useEffect(() => {
    setDismissed(loadHints()[hintKey]);
  }, [hintKey]);

  const dismiss = useCallback(() => {
    const current = loadHints();
    const updated = { ...current, [hintKey]: true };
    saveHints(updated);
    setDismissed(true);
  }, [hintKey]);

  return [dismissed, dismiss];
}
