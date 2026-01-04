/**
 * StemLoadingProgress - Visual feedback during stem loading
 */

import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, Music2, CheckCircle2 } from 'lucide-react';

interface StemLoadingProgressProps {
  progress: number; // 0-100
  stemsCount: number;
  loadedCount: number;
  className?: string;
}

export const StemLoadingProgress = memo(({
  progress,
  stemsCount,
  loadedCount,
  className,
}: StemLoadingProgressProps) => {
  const isComplete = loadedCount >= stemsCount;
  
  if (isComplete) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in",
        className
      )}>
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        <span>{stemsCount} треков готово</span>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Загрузка стемов ({loadedCount}/{stemsCount})</span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
});

StemLoadingProgress.displayName = 'StemLoadingProgress';

/**
 * StemTrackLoadingSkeleton - Skeleton for individual stem track
 */
interface StemTrackLoadingSkeletonProps {
  stemType?: string;
  className?: string;
}

const stemColors: Record<string, string> = {
  vocals: 'bg-blue-500/20',
  vocal: 'bg-blue-500/20',
  instrumental: 'bg-purple-500/20',
  drums: 'bg-orange-500/20',
  bass: 'bg-emerald-500/20',
  guitar: 'bg-amber-500/20',
  piano: 'bg-violet-500/20',
  keyboard: 'bg-violet-500/20',
  other: 'bg-gray-500/20',
};

export const StemTrackLoadingSkeleton = memo(({
  stemType = 'other',
  className,
}: StemTrackLoadingSkeletonProps) => {
  const bgColor = stemColors[stemType.toLowerCase()] || stemColors.other;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg animate-pulse",
      bgColor,
      className
    )}>
      {/* Icon placeholder */}
      <div className="w-8 h-8 rounded bg-background/50 flex items-center justify-center">
        <Music2 className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Info placeholder */}
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-background/50 rounded" />
        <div className="h-8 w-full bg-background/30 rounded" />
      </div>
      
      {/* Volume placeholder */}
      <div className="w-16 h-6 bg-background/50 rounded" />
    </div>
  );
});

StemTrackLoadingSkeleton.displayName = 'StemTrackLoadingSkeleton';
