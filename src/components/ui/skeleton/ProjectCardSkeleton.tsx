/**
 * ProjectCardSkeleton - Loading skeleton for project cards
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectCardSkeletonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function ProjectCardSkeleton({ variant = 'default', className }: ProjectCardSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3 p-3", className)}>
        <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      {/* Cover with gradient */}
      <div className="relative">
        <Skeleton className="w-full aspect-[16/9]" />
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Progress bar */}
        <Skeleton className="h-1.5 w-full rounded-full" />
        
        {/* Track thumbnails */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded" />
          ))}
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}

// List of skeletons
export function ProjectListSkeleton({ 
  count = 3, 
  variant = 'default' 
}: { 
  count?: number; 
  variant?: ProjectCardSkeletonProps['variant'];
}) {
  return (
    <div className={variant === 'compact' ? "space-y-2" : "grid gap-4 sm:grid-cols-2"}>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}