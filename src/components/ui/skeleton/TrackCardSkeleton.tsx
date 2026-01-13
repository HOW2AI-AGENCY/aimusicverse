/**
 * TrackCardSkeleton - Loading skeleton for track cards
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackCardSkeletonProps {
  variant?: 'default' | 'compact' | 'list';
  className?: string;
}

export function TrackCardSkeleton({ variant = 'default', className }: TrackCardSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3 p-2", className)}>
        <Skeleton className="w-10 h-10 rounded-md shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("flex items-center gap-3 p-3 border-b border-border/30", className)}>
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      {/* Cover */}
      <Skeleton className="w-full aspect-square" />
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// List of skeletons for loading states
export function TrackListSkeleton({ 
  count = 5, 
  variant = 'list' 
}: { 
  count?: number; 
  variant?: TrackCardSkeletonProps['variant'];
}) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

// Grid of skeletons
export function TrackGridSkeleton({ 
  count = 6 
}: { 
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} variant="default" />
      ))}
    </div>
  );
}