/**
 * TrackCardSkeleton - Loading skeleton for track cards
 * Feature: 032-professional-ui (P2 Skeletons)
 * 
 * Enhanced with:
 * - Shimmer animation
 * - Proper content matching
 * - Multiple variants
 */

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonAvatar } from '@/components/ui/skeleton';

interface TrackCardSkeletonProps {
  variant?: 'default' | 'compact' | 'list' | 'professional';
  className?: string;
  /** Enable stagger animation delay */
  index?: number;
}

export function TrackCardSkeleton({ variant = 'default', className, index = 0 }: TrackCardSkeletonProps) {
  // Stagger animation delay
  const staggerDelay = index * 50;
  const style = staggerDelay > 0 ? { animationDelay: `${staggerDelay}ms` } : undefined;

  if (variant === 'compact') {
    return (
      <div 
        className={cn("flex items-center gap-3 p-2", className)} 
        style={style}
      >
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" shape="card" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" intensity="subtle" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" shape="circle" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 border-b border-border/30",
          "animate-fade-in",
          className
        )} 
        style={style}
      >
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" shape="card" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" intensity="subtle" />
            <Skeleton className="h-3 w-12" intensity="subtle" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" shape="circle" />
          <Skeleton className="w-8 h-8 rounded-full" shape="circle" />
        </div>
      </div>
    );
  }

  if (variant === 'professional') {
    return (
      <div 
        className={cn(
          "rounded-xl border border-border/50 bg-card overflow-hidden animate-fade-in",
          className
        )}
        style={style}
      >
        {/* Cover with overlay skeleton */}
        <div className="relative aspect-square">
          <Skeleton className="w-full h-full" shape="square" />
          {/* Play button skeleton */}
          <div className="absolute bottom-2 right-2">
            <Skeleton className="w-10 h-10 rounded-full" shape="circle" />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <div className="flex items-center gap-2">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-3 w-20" intensity="subtle" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-12" intensity="subtle" />
              <Skeleton className="h-3 w-10" intensity="subtle" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" shape="card" />
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div 
      className={cn(
        "rounded-xl border border-border/50 bg-card overflow-hidden animate-fade-in",
        className
      )}
      style={style}
    >
      {/* Cover */}
      <Skeleton className="w-full aspect-square" shape="square" />
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" intensity="subtle" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-3 w-16" intensity="subtle" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" shape="circle" />
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
        <TrackCardSkeleton key={i} variant={variant} index={i} />
      ))}
    </div>
  );
}

// Grid of skeletons
export function TrackGridSkeleton({ 
  count = 6,
  variant = 'default',
}: { 
  count?: number;
  variant?: 'default' | 'professional';
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} variant={variant} index={i} />
      ))}
    </div>
  );
}