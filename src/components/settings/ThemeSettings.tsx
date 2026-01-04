import { useTheme } from '@/contexts/ThemeContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Smartphone, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'system',
    label: 'Авто',
    description: 'Синхронизация с Telegram',
    icon: <Smartphone className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    value: 'light',
    label: 'Светлая',
    description: 'Яркий дневной режим',
    icon: <Sun className="w-5 h-5" />,
    gradient: 'from-amber-400 to-orange-400',
  },
  {
    value: 'dark',
    label: 'Тёмная',
    description: 'Комфорт для глаз',
    icon: <Moon className="w-5 h-5" />,
    gradient: 'from-indigo-500 to-blue-600',
  },
];

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { hapticFeedback, webApp } = useTelegram();
  const isTelegramApp = !!webApp;

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    hapticFeedback('light');
    setTheme(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: resolvedTheme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
            </motion.div>
            Тема оформления
          </CardTitle>
          <CardDescription>
            Выберите предпочтительную тему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme selector cards */}
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const isSelected = theme === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon with gradient background */}
                  <motion.div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                      'bg-gradient-to-br shadow-lg',
                      option.gradient
                    )}
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {option.icon}
                  </motion.div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {option.description}
                    </p>
                  </div>
                  
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Info card */}
          <motion.div 
            className={cn(
              'p-3 rounded-xl border transition-colors duration-300',
              resolvedTheme === 'dark' 
                ? 'bg-indigo-500/10 border-indigo-500/20' 
                : 'bg-amber-500/10 border-amber-500/20'
            )}
            layout
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </motion.div>
              <p className="text-sm">
                Активная тема:{' '}
                <span className="font-semibold">
                  {resolvedTheme === 'dark' ? 'Тёмная' : 'Светлая'}
                </span>
              </p>
            </div>
            
            {isTelegramApp && theme === 'system' && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Синхронизировано с темой Telegram
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
