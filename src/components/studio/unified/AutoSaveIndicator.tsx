/**
 * AutoSaveIndicator - Visual indicator for auto-save status
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoSaveStatus } from '@/hooks/studio/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSavedAt: string | null;
  timeSinceLastSave: number | null;
  className?: string;
}

function formatTimeSince(seconds: number | null): string {
  if (seconds === null) return '';
  
  if (seconds < 60) {
    return 'только что';
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} мин. назад`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ч. назад`;
  }
}

export const AutoSaveIndicator = memo(function AutoSaveIndicator({
  status,
  lastSavedAt,
  timeSinceLastSave,
  className,
}: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Cloud,
          text: lastSavedAt ? formatTimeSince(timeSinceLastSave) : 'Синхронизировано',
          color: 'text-muted-foreground',
          animate: false,
        };
      case 'pending':
        return {
          icon: Cloud,
          text: 'Есть изменения',
          color: 'text-amber-500',
          animate: false,
        };
      case 'saving':
        return {
          icon: Loader2,
          text: 'Сохранение...',
          color: 'text-primary',
          animate: true,
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Сохранено',
          color: 'text-green-500',
          animate: false,
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Ошибка',
          color: 'text-destructive',
          animate: false,
        };
      default:
        return {
          icon: CloudOff,
          text: 'Офлайн',
          color: 'text-muted-foreground',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", config.color, className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5"
        >
          <Icon 
            className={cn(
              "h-3.5 w-3.5",
              config.animate && "animate-spin"
            )} 
          />
          <span className="hidden sm:inline">{config.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
