import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const BlogCardSkeleton = memo(function BlogCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="w-full sm:w-40 h-40 sm:h-32" />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3 mt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
});

export const BlogFeaturedSkeleton = memo(function BlogFeaturedSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 sm:h-64 w-full" />
      <div className="p-6 -mt-16 relative space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </Card>
  );
});

export const BlogListSkeleton = memo(function BlogListSkeleton() {
  return (
    <div className="space-y-4">
      <BlogFeaturedSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        <BlogCardSkeleton />
        <BlogCardSkeleton />
        <BlogCardSkeleton />
        <BlogCardSkeleton />
      </div>
    </div>
  );
});
