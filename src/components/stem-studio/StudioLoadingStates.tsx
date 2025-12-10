/**
 * Studio Loading States
 * 
 * Visual loading indicators for various studio operations
 */

import { motion } from '@/lib/motion';
import { Loader2, Music, Wand2, Sliders, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type LoadingState = 'loading' | 'processing' | 'applying' | 'success' | 'error';

interface StudioLoadingStateProps {
  state: LoadingState;
  message?: string;
  progress?: number;
  compact?: boolean;
  className?: string;
}

const stateConfig = {
  loading: {
    icon: Loader2,
    label: 'Загрузка...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  processing: {
    icon: Music,
    label: 'Обработка...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  applying: {
    icon: Wand2,
    label: 'Применение...',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  success: {
    icon: Check,
    label: 'Готово!',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  error: {
    icon: AlertCircle,
    label: 'Ошибка',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
};

export function StudioLoadingState({
  state,
  message,
  progress,
  compact = false,
  className,
}: StudioLoadingStateProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isAnimated = state === 'loading' || state === 'processing' || state === 'applying';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          config.bgColor,
          config.color,
          className
        )}
      >
        <Icon className={cn("w-3 h-3", isAnimated && "animate-spin")} />
        <span>{message || config.label}</span>
        {progress !== undefined && (
          <span className="font-mono ml-0.5">{progress}%</span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        config.bgColor,
        className
      )}
    >
      <div className={cn("flex-shrink-0", config.color)}>
        <Icon className={cn("w-5 h-5", isAnimated && "animate-spin")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message || config.label}</p>
        {progress !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className={cn("h-full", config.color.replace('text-', 'bg-'))}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {progress}%
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Effects Processing Indicator
 */
interface EffectsProcessingProps {
  effectType: 'eq' | 'compressor' | 'reverb' | 'all';
  isProcessing: boolean;
}

export function EffectsProcessingIndicator({ effectType, isProcessing }: EffectsProcessingProps) {
  if (!isProcessing) return null;

  const labels = {
    eq: 'Применение EQ',
    compressor: 'Применение компрессора',
    reverb: 'Применение ревербера',
    all: 'Применение эффектов',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
    >
      <Sliders className="w-3 h-3 animate-pulse" />
      {labels[effectType]}
    </motion.div>
  );
}

/**
 * Stem Loading Skeleton
 */
export function StemLoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-border/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Processing Overlay
 */
interface ProcessingOverlayProps {
  show: boolean;
  message?: string;
  progress?: number;
}

export function ProcessingOverlay({ show, message, progress }: ProcessingOverlayProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">
              {message || 'Обработка...'}
            </h3>
            {progress !== undefined && (
              <>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {progress}%
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Success Toast Badge
 */
export function SuccessBadge({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
    >
      <Check className="w-4 h-4" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}
