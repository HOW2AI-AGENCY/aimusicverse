import { useTelegram } from '@/contexts/TelegramContext';
import { useEffect, useState } from 'react';
import { X, Sparkles, Music, Mic, Layers } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';

interface BotContext {
  type: 'generate' | 'cover' | 'extend' | 'stems' | 'track' | 'library' | null;
  id?: string;
  prompt?: string;
}

/**
 * BotContextBanner - Shows context when user navigates from Telegram bot
 * Parses start_param to understand the navigation intent
 */
export function BotContextBanner() {
  const { webApp } = useTelegram();
  const [context, setContext] = useState<BotContext>({ type: null });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!webApp?.initDataUnsafe?.start_param) return;

    const startParam = webApp.initDataUnsafe.start_param;
    
    // Parse start_param format: action_id or just action
    // Examples: track_uuid, generate, cover_uuid, stems_uuid
    const parts = startParam.split('_');
    const action = parts[0];
    const id = parts.slice(1).join('_');

    switch (action) {
      case 'generate':
        setContext({ type: 'generate', prompt: id || undefined });
        break;
      case 'cover':
        setContext({ type: 'cover', id });
        break;
      case 'extend':
        setContext({ type: 'extend', id });
        break;
      case 'stems':
        setContext({ type: 'stems', id });
        break;
      case 'track':
        setContext({ type: 'track', id });
        break;
      case 'library':
        setContext({ type: 'library' });
        break;
      default:
        setContext({ type: null });
    }
  }, [webApp]);

  if (!context.type || dismissed) return null;

  const contextConfig = {
    generate: {
      icon: Sparkles,
      title: 'Создание трека',
      description: context.prompt 
        ? `Продолжаем с описанием: "${context.prompt.slice(0, 50)}..."` 
        : 'Готовы создать новый трек',
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    cover: {
      icon: Mic,
      title: 'Создание кавера',
      description: 'Переносим стиль на ваш трек',
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    extend: {
      icon: Music,
      title: 'Расширение трека',
      description: 'Продолжаем вашу композицию',
      color: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-400',
    },
    stems: {
      icon: Layers,
      title: 'Разделение стемов',
      description: 'Извлекаем вокал и инструменты',
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-400',
    },
    track: {
      icon: Music,
      title: 'Открытие трека',
      description: 'Переход к выбранному треку',
      color: 'from-indigo-500/20 to-violet-500/20',
      iconColor: 'text-indigo-400',
    },
    library: {
      icon: Music,
      title: 'Библиотека',
      description: 'Ваша коллекция треков',
      color: 'from-pink-500/20 to-rose-500/20',
      iconColor: 'text-pink-400',
    },
  };

  const config = contextConfig[context.type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${config.color} border border-white/10 mb-4`}
      >
        <div className="flex items-center gap-3 p-3">
          <div className={`p-2 rounded-lg bg-background/50 ${config.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{config.title}</p>
            <p className="text-xs text-muted-foreground truncate">{config.description}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
