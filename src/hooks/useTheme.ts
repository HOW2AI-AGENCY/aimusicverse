/**
 * useTheme - Theme management hook
 * Supports system, light, and dark themes
 * Syncs with Telegram theme when available
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'theme';

/**
 * Get system preferred color scheme
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  
  // Check Telegram theme first
  const tgColorScheme = window.Telegram?.WebApp?.colorScheme;
  if (tgColorScheme === 'light' || tgColorScheme === 'dark') {
    return tgColorScheme;
  }
  
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface UseThemeReturn {
  /** Current theme setting (light/dark/system) */
  theme: Theme;
  /** Resolved theme (always light or dark) */
  resolvedTheme: 'light' | 'dark';
  /** Set theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // Resolved theme (what's actually applied)
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    return theme === 'system' ? systemTheme : theme;
  }, [theme, systemTheme]);

  // Apply theme on change
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setSystemTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Also listen for Telegram theme changes
    const handleTgThemeChange = () => {
      setSystemTheme(getSystemTheme());
    };
    
    window.Telegram?.WebApp?.onEvent?.('themeChanged', handleTgThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.Telegram?.WebApp?.offEvent?.('themeChanged', handleTgThemeChange);
    };
  }, []);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}