/**
 * TrackCardSkeleton - Loading skeleton for track cards
 * Matches the GridVariant layout for smooth loading transitions
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrackCardSkeletonProps {
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

export const TrackCardSkeleton = memo(function TrackCardSkeleton({
  variant = 'grid',
  className,
}: TrackCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <Card className={cn("p-3 flex items-center gap-3", className)}>
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      </Card>
    );
  }
  
  if (variant === 'compact') {
    return (
      <Card className={cn("p-2 flex items-center gap-2", className)}>
        <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </Card>
    );
  }
  
  // Grid variant (default)
  return (
    <Card className={cn("overflow-hidden rounded-2xl", className)}>
      {/* Cover skeleton */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </Card>
  );
});

/**
 * TrackGridSkeleton - Grid of track card skeletons
 */
interface TrackGridSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

export const TrackGridSkeleton = memo(function TrackGridSkeleton({
  count = 6,
  variant = 'grid',
  className,
}: TrackGridSkeletonProps) {
  const gridClass = variant === 'grid' 
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
    : 'space-y-2';
  
  return (
    <div className={cn(gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
});
