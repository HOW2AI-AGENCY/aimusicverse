import { Card } from "./card";
import { Skeleton } from "./skeleton";

export const ProfileSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
  </Card>
);

export const ActivitySkeleton = () => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded" />
      <div className="flex-1">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </Card>
);

export const StatCardSkeleton = () => (
  <Card className="p-6">
    <Skeleton className="h-4 w-24 mb-4" />
    <Skeleton className="h-8 w-16" />
  </Card>
);

export const NotificationSkeleton = () => (
  <div className="p-3 rounded-lg">
    <div className="flex gap-3">
      <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);

export const TaskSkeleton = () => (
  <div className="p-4 rounded-lg border">
    <div className="flex items-start gap-3">
      <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded" />
    </div>
  </div>
);

export function TrackCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-card/50 border border-border/30">
      <Skeleton className="aspect-square w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Generic skeleton loader for library components
interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'row';
}

export function SkeletonLoader({ count = 4, type = 'card' }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {type === 'card' ? (
            <div className="space-y-2">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <div className="flex items-center gap-3 h-16 px-4">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-11 h-11 rounded" />
              <Skeleton className="w-11 h-11 rounded" />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
