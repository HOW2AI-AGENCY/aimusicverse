/**
 * ShimmerSkeleton - Enhanced skeleton with shimmer animation
 * For improved loading states
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ShimmerSkeleton = memo(function ShimmerSkeleton({
  className,
  width,
  height,
  rounded = 'md',
}: ShimmerSkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        roundedClass[rounded],
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
});

interface TrackSkeletonShimmerProps {
  layout?: 'grid' | 'list';
}

export const TrackSkeletonShimmer = memo(function TrackSkeletonShimmer({
  layout = 'list',
}: TrackSkeletonShimmerProps) {
  if (layout === 'grid') {
    return (
      <div className="space-y-2 p-2">
        <ShimmerSkeleton className="aspect-square w-full" rounded="lg" />
        <ShimmerSkeleton className="h-4 w-3/4" />
        <ShimmerSkeleton className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2">
      <ShimmerSkeleton className="w-12 h-12 flex-shrink-0" rounded="lg" />
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-4 w-3/4" />
        <ShimmerSkeleton className="h-3 w-1/2" />
      </div>
      <ShimmerSkeleton className="w-10 h-10 flex-shrink-0" rounded="full" />
    </div>
  );
});

interface MultiSkeletonProps {
  count?: number;
  layout?: 'grid' | 'list';
}

export const MultiTrackSkeletonShimmer = memo(function MultiTrackSkeletonShimmer({
  count = 5,
  layout = 'list',
}: MultiSkeletonProps) {
  return (
    <div className={cn(
      layout === 'grid' 
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        : "flex flex-col gap-2"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <TrackSkeletonShimmer key={i} layout={layout} />
      ))}
    </div>
  );
});
