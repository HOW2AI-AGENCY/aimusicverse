import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { logger } from '@/lib/logger';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeLogger = logger.child({ module: 'ThemeContext' });

const THEME_STORAGE_KEY = 'musicverse-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getTelegramTheme(): ResolvedTheme | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const colorScheme = window.Telegram.WebApp.colorScheme;
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme;
    }
  }
  return null;
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return null;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    // First check Telegram theme, then system preference
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      return telegramTheme;
    }
    return getSystemTheme();
  }
  return theme;
}

function applyThemeToDOM(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? 'hsl(220, 20%, 7%)' : 'hsl(220, 20%, 98%)'
    );
  }
  
  themeLogger.debug('Theme applied to DOM', { resolvedTheme });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with stored theme or 'system' as default
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme() || 'system';
    return resolveTheme(initialTheme);
  });

  // Apply theme and save to storage
  const setTheme = useCallback((newTheme: Theme) => {
    themeLogger.info('Theme changed', { from: theme, to: newTheme });
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, [theme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Initial setup and listen for system/Telegram theme changes
  useEffect(() => {
    // Apply initial theme
    applyThemeToDOM(resolvedTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      themeLogger.debug('System theme changed', { dark: e.matches });
      
      // Only update if using system theme
      if (theme === 'system') {
        const telegramTheme = getTelegramTheme();
        const newResolved = telegramTheme || (e.matches ? 'dark' : 'light');
        setResolvedTheme(newResolved);
        applyThemeToDOM(newResolved);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Listen for Telegram theme changes
    const tg = window.Telegram?.WebApp;
    if (tg?.onEvent) {
      const handleTelegramThemeChange = () => {
        themeLogger.debug('Telegram theme changed', { colorScheme: tg.colorScheme });
        
        // If using system theme, follow Telegram
        if (theme === 'system') {
          const newResolved = tg.colorScheme || getSystemTheme();
          setResolvedTheme(newResolved);
          applyThemeToDOM(newResolved);
        }
      };
      
      tg.onEvent('themeChanged', handleTelegramThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
        tg.offEvent?.('themeChanged', handleTelegramThemeChange);
      };
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values if used outside provider (e.g., in Sonner)
    return {
      theme: 'system' as Theme,
      resolvedTheme: 'dark' as ResolvedTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
