/**
 * ThemeToggle - System/Light/Dark mode toggle
 * Syncs with Telegram theme when in Mini App
 */

import { memo, useCallback } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { hapticImpact } from '@/lib/haptic';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
}

export const ThemeToggle = memo(function ThemeToggle({
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    hapticImpact('light');
    setTheme(newTheme);
  }, [setTheme]);

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;
  const themeLabel = theme === 'system' 
    ? 'Системная' 
    : theme === 'dark' 
    ? 'Тёмная' 
    : 'Светлая';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn(
            "gap-2",
            size === 'icon' && "w-9 h-9",
            className
          )}
        >
          <ThemeIcon className="h-4 w-4" />
          {showLabel && <span>{themeLabel}</span>}
          <span className="sr-only">Переключить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Светлая</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Тёмная</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Системная</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

/**
 * Simple toggle button (no dropdown)
 */
export const ThemeToggleSimple = memo(function ThemeToggleSimple({
  className,
}: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    hapticImpact('light');
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("w-9 h-9", className)}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
});