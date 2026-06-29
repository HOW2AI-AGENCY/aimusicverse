import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/usePreferencesStore";

export function useDisplayPreferences() {
  const preferences = usePreferencesStore((s) => s.preferences);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setTextSize = usePreferencesStore((s) => s.setTextSize);
  const setReducedMotion = usePreferencesStore((s) => s.setReducedMotion);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === "auto") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.toggle("dark", preferences.theme === "dark");
      root.classList.toggle("light", preferences.theme === "light");
    }
  }, [preferences.theme]);

  useEffect(() => {
    const scale = preferences.textSize === "small" ? 0.875 : preferences.textSize === "large" ? 1.125 : 1.0;
    document.documentElement.style.setProperty("--text-scale", String(scale));
  }, [preferences.textSize]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && !preferences.reducedMotion) {
      setReducedMotion(true);
    }
  }, [preferences.reducedMotion, setReducedMotion]);

  return {
    ...preferences,
    setTheme,
    setTextSize,
    setReducedMotion,
  };
}
