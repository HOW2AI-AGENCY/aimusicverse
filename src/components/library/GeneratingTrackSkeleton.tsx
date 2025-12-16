import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music2, Sparkles, Wand2, AudioWaveform, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

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

const ICONS = [Sparkles, Wand2, Music2, AudioWaveform, Zap];

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
      const elapsed = (Date.now() - startTime) / 1000;
      
      let newProgress: number;
      
      if (elapsed < 10) {
        newProgress = 10 + (elapsed / 10) * 15;
      } else if (elapsed < 30) {
        newProgress = 25 + ((elapsed - 10) / 20) * 20;
      } else if (elapsed < 90) {
        newProgress = 45 + ((elapsed - 30) / 60) * 25;
      } else if (elapsed < 150) {
        newProgress = 70 + ((elapsed - 90) / 60) * 15;
      } else {
        newProgress = Math.min(85 + ((elapsed - 150) / 120) * 10, 95);
      }
      
      setProgress(Math.round(newProgress));
      
      const statusGroup = STATUS_MESSAGES.find(
        g => newProgress >= g.min && newProgress < g.max
      ) || STATUS_MESSAGES[STATUS_MESSAGES.length - 1];
      
      const messageIndex = Math.floor(Math.random() * statusGroup.messages.length);
      setStatusMessage(statusGroup.messages[messageIndex]);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 3000);
    
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
      <Card className="p-3 sm:p-4 border-generate/30 bg-gradient-to-r from-generate/10 to-primary/5 relative overflow-hidden">
        {/* Animated shimmer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="flex items-center gap-3 relative">
          {/* Animated cover placeholder */}
          <motion.div 
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-generate/30 to-primary/20 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={iconIndex}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-6 h-6 text-generate" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4 text-generate" />
              </motion.div>
              <span className="text-sm font-medium text-generate truncate">
                {statusMessage}
              </span>
              <Badge variant="outline" className="ml-auto text-[10px] border-generate/30 text-generate">
                {progress}%
              </Badge>
            </div>
            <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-generate to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div 
                className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '500%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            {prompt && (
              <p className="text-xs text-muted-foreground truncate">
                {prompt.substring(0, 60)}...
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-generate/30 bg-gradient-to-b from-generate/10 to-transparent relative group">
      {/* Cover placeholder with animation */}
      <div className="aspect-square relative bg-gradient-to-br from-generate/20 via-primary/10 to-background flex items-center justify-center overflow-hidden">
        {/* Animated background waves */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-generate/20"
              style={{ scale: 0.5 + i * 0.2 }}
              animate={{ 
                scale: [0.5 + i * 0.2, 0.8 + i * 0.2, 0.5 + i * 0.2],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>
        
        {/* Animated icon */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <motion.div 
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-generate/30 to-primary/20 flex items-center justify-center shadow-xl"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={iconIndex}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-10 h-10 text-generate" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <div className="text-center px-4">
            <motion.p 
              className="text-sm font-medium text-generate"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {statusMessage}
            </motion.p>
          </div>
        </div>
        
        {/* Progress ring effect */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--generate) / 0.1)"
            strokeWidth="2"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--generate))"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 283' }}
            animate={{ strokeDasharray: `${progress * 2.83} 283` }}
            transition={{ duration: 0.5 }}
          />
        </svg>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Title with loader */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4 text-generate flex-shrink-0" />
          </motion.div>
          <span className="text-sm font-medium text-generate">Генерация...</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-generate/30 text-generate tabular-nums">
            {progress}%
          </Badge>
        </div>
        
        {/* Progress bar with shimmer */}
        <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-generate via-primary to-generate rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div 
            className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        
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
