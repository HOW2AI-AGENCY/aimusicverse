/**
 * StemsLoadingProgress - Visual indicator for stems loading state
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Loader2, Music } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StemsLoadingProgressProps {
  progress: number;
  isLoading: boolean;
  totalStems?: number;
  className?: string;
}

export const StemsLoadingProgress = memo(function StemsLoadingProgress({
  progress,
  isLoading,
  totalStems = 0,
  className,
}: StemsLoadingProgressProps) {
  if (!isLoading && progress >= 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20",
        className
      )}
    >
      <div className="shrink-0">
        {progress < 100 ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Music className="w-5 h-5 text-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            {progress < 100 ? 'Загрузка стемов...' : 'Стемы готовы'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </motion.div>
  );
});
