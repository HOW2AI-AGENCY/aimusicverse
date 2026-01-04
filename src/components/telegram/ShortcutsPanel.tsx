// @ts-nocheck - Telegram WebApp API types are dynamic
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { 
  Home, 
  Music, 
  Folder, 
  Wand2, 
  ListMusic,
  Sparkles,
  Check,
  Plus,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  deeplink: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    id: 'home',
    name: 'Главная',
    description: 'Открыть главную страницу',
    icon: <Home className="h-5 w-5" />,
    deeplink: 'home',
  },
  {
    id: 'generate',
    name: 'Создать трек',
    description: 'Быстрая генерация музыки',
    icon: <Sparkles className="h-5 w-5" />,
    deeplink: 'generate',
  },
  {
    id: 'library',
    name: 'Библиотека',
    description: 'Ваши треки и плейлисты',
    icon: <Music className="h-5 w-5" />,
    deeplink: 'library',
  },
  {
    id: 'projects',
    name: 'Проекты',
    description: 'Альбомы и проекты',
    icon: <Folder className="h-5 w-5" />,
    deeplink: 'projects',
  },
  {
    id: 'studio',
    name: 'Студия',
    description: 'Редактор треков',
    icon: <Wand2 className="h-5 w-5" />,
    deeplink: 'studio',
  },
  {
    id: 'music-lab',
    name: 'Music Lab',
    description: 'Творческие инструменты',
    icon: <ListMusic className="h-5 w-5" />,
    deeplink: 'music-lab',
  },
];

type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed' | 'checking';

export function ShortcutsPanel() {
  const { webApp } = useTelegram();
  const [status, setStatus] = useState<HomeScreenStatus>('checking');
  const [addedShortcuts, setAddedShortcuts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!webApp?.checkHomeScreenStatus) {
      setStatus('unsupported');
      return;
    }

    try {
      webApp.checkHomeScreenStatus((result) => {
        setStatus(result);
      });
    } catch {
      setStatus('unsupported');
    }

    // Load saved shortcuts from localStorage
    const saved = localStorage.getItem('telegram_shortcuts');
    if (saved) {
      try {
        setAddedShortcuts(new Set(JSON.parse(saved)));
      } catch {
        // Ignore parse errors
      }
    }
  }, [webApp]);

  const handleAddMainShortcut = () => {
    if (!webApp?.addToHomeScreen) {
      toast.error('Функция недоступна');
      return;
    }

    webApp.addToHomeScreen();
    
    setTimeout(() => {
      try {
        webApp.checkHomeScreenStatus?.((result) => {
          setStatus(result);
          if (result === 'added') {
            toast.success('Приложение добавлено на главный экран!');
          }
        });
      } catch {
        // Ignore
      }
    }, 2000);
  };

  const handleAddShortcut = (shortcut: Shortcut) => {
    // Store the shortcut preference
    const newShortcuts = new Set(addedShortcuts);
    newShortcuts.add(shortcut.id);
    setAddedShortcuts(newShortcuts);
    localStorage.setItem('telegram_shortcuts', JSON.stringify([...newShortcuts]));

    // Try to add to home screen with deep link
    if (webApp?.addToHomeScreen) {
      // Note: Telegram's addToHomeScreen doesn't support custom deep links per shortcut
      // This adds the main app, but we track user's preferred shortcuts
      webApp.addToHomeScreen();
      toast.success(`Ярлык "${shortcut.name}" сохранён`);
    } else {
      toast.info(`Ярлык "${shortcut.name}" добавлен в избранное`);
    }
  };

  const isShortcutAdded = (id: string) => addedShortcuts.has(id);

  if (status === 'unsupported') {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            Ярлыки приложения
          </CardTitle>
          <CardDescription>
            Функция ярлыков доступна только в мобильном Telegram
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-5 w-5" />
          Ярлыки приложения
        </CardTitle>
        <CardDescription>
          Добавьте быстрый доступ к разделам на главный экран
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main app shortcut */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">MusicVerse AI</p>
              <p className="text-xs text-muted-foreground">Основное приложение</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={status === 'added' ? 'secondary' : 'default'}
            onClick={handleAddMainShortcut}
            disabled={status === 'added'}
          >
            {status === 'added' ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Добавлено
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </>
            )}
          </Button>
        </div>

        {/* Section shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.slice(1).map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={() => handleAddShortcut(shortcut)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors text-left',
                isShortcutAdded(shortcut.id)
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card hover:bg-accent/50 border-border'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isShortcutAdded(shortcut.id) ? 'bg-primary/10' : 'bg-muted'
              )}>
                {shortcut.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{shortcut.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {shortcut.description}
                </p>
              </div>
              {isShortcutAdded(shortcut.id) && (
                <Check className="h-3 w-3 text-primary absolute top-2 right-2" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
