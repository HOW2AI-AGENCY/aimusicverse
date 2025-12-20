/**
 * Audio Loading Progress Component
 * 
 * Shows loading progress for multiple audio stems with
 * individual and overall progress indicators.
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StemLoadingState {
  stemId: string;
  stemType: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  progress?: number;
}

interface AudioLoadingProgressProps {
  stems: StemLoadingState[];
  className?: string;
  compact?: boolean;
}

const STEM_TYPE_LABELS: Record<string, string> = {
  vocals: 'Вокал',
  bass: 'Бас',
  drums: 'Ударные',
  other: 'Другое',
  instrumental: 'Инструментал',
  piano: 'Пианино',
  guitar: 'Гитара',
};

export const AudioLoadingProgress = memo(function AudioLoadingProgress({
  stems,
  className,
  compact = false,
}: AudioLoadingProgressProps) {
  const overallProgress = useMemo(() => {
    if (stems.length === 0) return 100;
    
    const loadedCount = stems.filter(s => s.status === 'loaded').length;
    const loadingProgress = stems
      .filter(s => s.status === 'loading')
      .reduce((acc, s) => acc + (s.progress || 0), 0);
    
    const loadingCount = stems.filter(s => s.status === 'loading').length;
    const avgLoadingProgress = loadingCount > 0 ? loadingProgress / loadingCount : 0;
    
    return Math.round(
      ((loadedCount + (loadingCount * avgLoadingProgress / 100)) / stems.length) * 100
    );
  }, [stems]);

  const isComplete = overallProgress === 100;
  const hasErrors = stems.some(s => s.status === 'error');

  if (isComplete && !hasErrors) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50",
          className
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">
          Загрузка {overallProgress}%
        </span>
        <Progress value={overallProgress} className="w-16 h-1.5" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2",
        className
      )}
    >
      {/* Overall progress */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Загрузка аудио</span>
        <span className="font-mono text-primary">{overallProgress}%</span>
      </div>
      <Progress value={overallProgress} className="h-2" />

      {/* Individual stems */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {stems.map((stem) => (
            <motion.div
              key={stem.stemId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-[11px]",
                stem.status === 'loaded' && "bg-primary/10 text-primary",
                stem.status === 'loading' && "bg-muted/50",
                stem.status === 'error' && "bg-destructive/10 text-destructive",
                stem.status === 'pending' && "text-muted-foreground"
              )}
            >
              {stem.status === 'loading' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {stem.status === 'loaded' && (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {stem.status === 'error' && (
                <AlertCircle className="w-3 h-3" />
              )}
              <span className="truncate">
                {STEM_TYPE_LABELS[stem.stemType] || stem.stemType}
              </span>
              {stem.status === 'loading' && stem.progress !== undefined && (
                <span className="ml-auto font-mono">{stem.progress}%</span>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
});
