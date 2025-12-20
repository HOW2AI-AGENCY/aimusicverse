/**
 * StemTrackSkeleton - Loading placeholder for stem tracks
 * 
 * Displays animated skeleton UI while stems are loading
 * Matches the exact layout of StemTrackRow components
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StemTrackSkeletonProps {
  count?: number;
  isMobile?: boolean;
  className?: string;
}

const SingleStemSkeleton = memo(({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="relative">
        <div className={cn(
          "flex flex-col rounded-xl overflow-hidden",
          "bg-gradient-to-r from-muted/30 to-muted/10",
          "border border-border/30"
        )}>
          {/* Header row */}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Icon skeleton */}
              <Skeleton className="w-7 h-7 rounded-lg" />
              {/* Label skeleton */}
              <Skeleton className="h-3 w-10" />
            </div>
            
            {/* Controls skeleton */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-10 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>

          {/* Waveform skeleton with shimmer effect */}
          <div className="h-14 px-1 pb-1">
            <div className="h-full w-full rounded-lg overflow-hidden relative bg-muted/20">
              <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-muted/40 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 20}%`,
                      animationDelay: `${i * 20}ms`,
                    }}
                  />
                ))}
              </div>
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop skeleton
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-1.5",
      "border-b border-border/20"
    )}>
      {/* Track label */}
      <div className="flex items-center gap-2 w-32 shrink-0">
        <Skeleton className="w-6 h-6 rounded-md" />
        <Skeleton className="h-3 w-8" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
        <div className="w-20 px-2">
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* Waveform skeleton */}
      <div className="flex-1 h-12 relative overflow-hidden rounded-md bg-muted/20">
        <div className="absolute inset-0 flex items-center justify-center gap-[1px]">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="w-[1px] bg-muted/40 rounded-full animate-pulse"
              style={{
                height: `${15 + Math.sin(i * 0.2) * 10 + Math.random() * 25}%`,
                animationDelay: `${i * 15}ms`,
              }}
            />
          ))}
        </div>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center gap-1 shrink-0">
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  );
});

SingleStemSkeleton.displayName = 'SingleStemSkeleton';

export const StemTrackSkeleton = memo(({ 
  count = 4, 
  isMobile = false,
  className 
}: StemTrackSkeletonProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SingleStemSkeleton key={i} isMobile={isMobile} />
      ))}
    </div>
  );
});

StemTrackSkeleton.displayName = 'StemTrackSkeleton';
