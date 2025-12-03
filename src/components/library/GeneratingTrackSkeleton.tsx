import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Loader2, Music2, Sparkles, Wand2, AudioWaveform } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratingTrackSkeletonProps {
  status: string;
  prompt?: string;
  createdAt?: string;
  layout?: 'grid' | 'list';
}

const STATUS_MESSAGES = [
  { min: 0, max: 15, messages: ['Отправка запроса...', 'Подключение к серверу...', 'Инициализация...'] },
  { min: 15, max: 30, messages: ['Анализ промпта...', 'Подбор стиля...', 'Настройка параметров...'] },
  { min: 30, max: 50, messages: ['Генерация музыки...', 'Создание мелодии...', 'Синтез звука...'] },
  { min: 50, max: 70, messages: ['Добавление инструментов...', 'Микширование...', 'Обработка вокала...'] },
  { min: 70, max: 85, messages: ['Финальная обработка...', 'Мастеринг...', 'Оптимизация качества...'] },
  { min: 85, max: 100, messages: ['Почти готово...', 'Загрузка файлов...', 'Завершение...'] },
];

const ICONS = [Sparkles, Wand2, Music2, AudioWaveform];

export const GeneratingTrackSkeleton = ({ 
  status, 
  prompt, 
  createdAt,
  layout = 'grid' 
}: GeneratingTrackSkeletonProps) => {
  const [progress, setProgress] = useState(10);
  const [statusMessage, setStatusMessage] = useState('Подготовка...');
  const [iconIndex, setIconIndex] = useState(0);

  // Calculate elapsed time and update progress
  useEffect(() => {
    if (status === 'completed' || status === 'failed') return;

    const startTime = createdAt ? new Date(createdAt).getTime() : Date.now();
    
    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      
      // Progress curve: fast start, slow middle, fast end
      // Max progress at ~3 minutes (180 seconds), never reaches 100 until done
      let newProgress: number;
      
      if (elapsed < 10) {
        newProgress = 10 + (elapsed / 10) * 15; // 10-25% in first 10 seconds
      } else if (elapsed < 30) {
        newProgress = 25 + ((elapsed - 10) / 20) * 20; // 25-45% in next 20 seconds
      } else if (elapsed < 90) {
        newProgress = 45 + ((elapsed - 30) / 60) * 25; // 45-70% in next 60 seconds
      } else if (elapsed < 150) {
        newProgress = 70 + ((elapsed - 90) / 60) * 15; // 70-85% in next 60 seconds
      } else {
        newProgress = Math.min(85 + ((elapsed - 150) / 120) * 10, 95); // 85-95% slowly
      }
      
      setProgress(Math.round(newProgress));
      
      // Find appropriate status message
      const statusGroup = STATUS_MESSAGES.find(
        g => newProgress >= g.min && newProgress < g.max
      ) || STATUS_MESSAGES[STATUS_MESSAGES.length - 1];
      
      const messageIndex = Math.floor(Math.random() * statusGroup.messages.length);
      setStatusMessage(statusGroup.messages[messageIndex]);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, [status, createdAt]);

  // Rotate icons
  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex(prev => (prev + 1) % ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const Icon = ICONS[iconIndex];

  if (layout === 'list') {
    return (
      <Card className="p-3 sm:p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          {/* Animated cover placeholder */}
          <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
            <Icon className="w-6 h-6 text-primary animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary truncate">
                {statusMessage}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
            {prompt && (
              <p className="text-xs text-muted-foreground truncate">
                {prompt.substring(0, 60)}...
              </p>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress}%
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      {/* Cover placeholder with animation */}
      <div className="aspect-square relative bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
        
        {/* Animated icon */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-primary">{statusMessage}</p>
          </div>
        </div>
        
        {/* Progress ring effect */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary) / 0.1)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray={`${progress * 2.83} 283`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-primary">Генерация...</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{progress}%</span>
        </div>
        
        {/* Progress bar */}
        <Progress value={progress} className="h-2" />
        
        {/* Prompt preview */}
        {prompt && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {prompt}
          </p>
        )}
      </div>
    </Card>
  );
};

// CSS for shimmer animation - add to index.css
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }
