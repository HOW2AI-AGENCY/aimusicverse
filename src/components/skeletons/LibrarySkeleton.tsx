/**
 * LibrarySkeleton - Loading state for Library page
 * Shown while tracks are being fetched
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LibrarySkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export function LibrarySkeleton({ viewMode = 'grid', count = 6 }: LibrarySkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Track cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
              <Skeleton className="w-12 h-12 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact skeleton for mobile lists
 */
export function LibrarySkeletonCompact() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <Skeleton className="h-8 w-8 min-h-touch min-w-touch rounded-md" />
        </div>
      ))}
    </div>
  );
}
