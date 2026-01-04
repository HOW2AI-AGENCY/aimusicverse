import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { hapticFeedback } = useTelegram();

  const handleToggle = () => {
    hapticFeedback('light');
    toggleTheme();
  };

  const handleSelect = (newTheme: 'light' | 'dark' | 'system') => {
    hapticFeedback('light');
    setTheme(newTheme);
  };

  // Simple icon toggle between light/dark
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={cn(
          'h-9 w-9 rounded-full transition-all duration-300',
          'hover:bg-accent hover:scale-105',
          className
        )}
        aria-label={resolvedTheme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      >
        <Sun className={cn(
          'h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300',
          resolvedTheme === 'dark' && '-rotate-90 scale-0'
        )} />
        <Moon className={cn(
          'absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300',
          resolvedTheme === 'dark' && 'rotate-0 scale-100'
        )} />
      </Button>
    );
  }

  // Dropdown with all options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 rounded-full transition-all duration-300',
            'hover:bg-accent hover:scale-105',
            className
          )}
          aria-label="Выбрать тему"
        >
          <Sun className={cn(
            'h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300',
            resolvedTheme === 'dark' && '-rotate-90 scale-0'
          )} />
          <Moon className={cn(
            'absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300',
            resolvedTheme === 'dark' && 'rotate-0 scale-100'
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => handleSelect('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <Sun className="mr-2 h-4 w-4" />
          Светлая
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <Moon className="mr-2 h-4 w-4" />
          Тёмная
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          Авто
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
