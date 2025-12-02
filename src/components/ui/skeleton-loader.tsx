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

export const TrackCardSkeleton = ({ layout = 'grid' }: { layout?: 'grid' | 'list' }) => {
  if (layout === 'list') {
    return (
      <Card className="p-3 sm:p-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-16 sm:w-14 sm:h-14 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-10 h-10 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  );
};
