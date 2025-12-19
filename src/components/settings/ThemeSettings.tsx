import { useTheme } from '@/contexts/ThemeContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Smartphone } from 'lucide-react';
import { motion } from '@/lib/motion';

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { hapticFeedback } = useTelegram();

  const handleThemeChange = (value: string) => {
    hapticFeedback('light');
    setTheme(value as 'light' | 'dark' | 'system');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            Тема оформления
          </CardTitle>
          <CardDescription>
            Выберите предпочтительную тему или используйте автоматическое определение
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={theme} 
            onValueChange={handleThemeChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="system" id="theme-system" />
              <Label 
                htmlFor="theme-system" 
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Авто</p>
                  <p className="text-sm text-muted-foreground">
                    Следовать теме Telegram или системы
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="light" id="theme-light" />
              <Label 
                htmlFor="theme-light" 
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">Светлая</p>
                  <p className="text-sm text-muted-foreground">
                    Всегда использовать светлую тему
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label 
                htmlFor="theme-dark" 
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="font-medium">Тёмная</p>
                  <p className="text-sm text-muted-foreground">
                    Всегда использовать тёмную тему
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Текущая тема: <span className="font-medium text-foreground">{resolvedTheme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
