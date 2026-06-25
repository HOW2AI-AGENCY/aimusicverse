/**
 * Telegram Theme Provider
 * Feature: 032-professional-ui
 *
 * Syncs app theme with Telegram Mini App theme
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useTelegram } from "@/contexts/TelegramContext";

type Theme = "light" | "dark" | "system";

interface TelegramThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  isTelegramTheme: boolean;
  telegramColors: {
    bgColor?: string;
    textColor?: string;
    hintColor?: string;
    linkColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    secondaryBgColor?: string;
  };
}

const TelegramThemeContext = createContext<TelegramThemeContextValue | null>(null);

interface TelegramThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function TelegramThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
}: TelegramThemeProviderProps) {
  const { webApp, isInitialized } = useTelegram();
  const isTelegram = isInitialized && !!webApp;
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  // Get Telegram color scheme
  const telegramColorScheme = webApp?.colorScheme;

  // Extract Telegram theme params
  const telegramColors = {
    bgColor: webApp?.themeParams?.bg_color,
    textColor: webApp?.themeParams?.text_color,
    hintColor: webApp?.themeParams?.hint_color,
    linkColor: webApp?.themeParams?.link_color,
    buttonColor: webApp?.themeParams?.button_color,
    buttonTextColor: webApp?.themeParams?.button_text_color,
    secondaryBgColor: webApp?.themeParams?.secondary_bg_color,
  };

  // Resolve actual theme
  const resolvedTheme = (() => {
    // If in Telegram, prioritize Telegram's color scheme
    if (isTelegram && telegramColorScheme) {
      return telegramColorScheme;
    }

    // Handle system preference
    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "dark";
    }

    return theme;
  })();

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    // Apply Telegram colors as CSS variables if available
    if (isTelegram && telegramColors.bgColor) {
      root.style.setProperty("--tg-bg-color", telegramColors.bgColor);
      root.style.setProperty("--tg-text-color", telegramColors.textColor || "");
      root.style.setProperty("--tg-hint-color", telegramColors.hintColor || "");
      root.style.setProperty("--tg-link-color", telegramColors.linkColor || "");
      root.style.setProperty("--tg-button-color", telegramColors.buttonColor || "");
      root.style.setProperty("--tg-button-text-color", telegramColors.buttonTextColor || "");
      root.style.setProperty("--tg-secondary-bg-color", telegramColors.secondaryBgColor || "");
    }
  }, [resolvedTheme, isTelegram, telegramColors]);

  // Listen for Telegram theme changes
  useEffect(() => {
    if (!isTelegram || !webApp) return;

    const handleThemeChanged = () => {
      // Force re-render to pick up new theme
      setThemeState((prev) => prev);
    };

    webApp.onEvent("themeChanged", handleThemeChanged);

    return () => {
      webApp.offEvent("themeChanged", handleThemeChanged);
    };
  }, [isTelegram, webApp]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setThemeState("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  return (
    <TelegramThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        isTelegramTheme: isTelegram,
        telegramColors,
      }}
    >
      {children}
    </TelegramThemeContext.Provider>
  );
}

export function useTelegramTheme() {
  const context = useContext(TelegramThemeContext);
  if (!context) {
    throw new Error("useTelegramTheme must be used within TelegramThemeProvider");
  }
  return context;
}

export default TelegramThemeProvider;
