/**
 * ProjectsSkeleton - Loading state for Projects page
 * Shown while projects are being fetched
 */

import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen } from 'lucide-react';

export function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-projects/20 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-projects" />
          </div>
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Projects grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card/50 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact mobile skeleton for projects
 */
export function ProjectsSkeletonMobile() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
