/**
 * ProfileSkeleton - Loading skeleton for profile views
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileSkeletonProps {
  variant?: 'full' | 'header' | 'compact';
  className?: string;
}

export function ProfileSkeleton({ variant = 'full', className }: ProfileSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Banner */}
        <Skeleton className="w-full h-32 rounded-xl" />
        
        {/* Avatar and info */}
        <div className="flex items-end gap-4 -mt-10 px-4">
          <Skeleton className="w-20 h-20 rounded-full border-4 border-background shrink-0" />
          <div className="space-y-2 flex-1 pb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    );
  }

  // Full profile skeleton
  return (
    <div className={cn("space-y-6", className)}>
      {/* Banner */}
      <Skeleton className="w-full h-40 rounded-xl" />
      
      {/* Profile header */}
      <div className="flex flex-col items-center -mt-16 relative z-10">
        <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
        <div className="mt-3 space-y-2 text-center">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
      
      {/* Bio */}
      <div className="px-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Stats */}
      <div className="flex justify-center gap-8 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-3 px-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 px-4 border-b border-border pb-3">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}