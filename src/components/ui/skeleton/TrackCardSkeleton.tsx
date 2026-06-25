/**
 * TrackCardSkeleton - Loading skeleton for track cards
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackCardSkeletonProps {
    variant?: 'default' | 'compact' | 'list';
    className?: string;
}

export function TrackCardSkeleton({ variant = 'default', className }: TrackCardSkeletonProps) {
    if (variant === 'compact') {
        return (
            <div className={cn("flex items-center gap-3 p-2", className)}>
                <Skeleton className="w-12 h-12 rounded-md shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className={cn("flex items-center gap-4 p-3", className)}>
                <Skeleton className="w-10 h-10 rounded shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        );
    }

    // Default card variant
    return (
        <div className={cn("rounded-lg border border-border/50 bg-card overflow-hidden", className)}>
            {/* Cover image */}
            <div className="relative aspect-square">
                <Skeleton className="w-full h-full" />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="h-12 w-12 rounded-full opacity-0 group-hover:opacity-100" />
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />

                {/* Meta info */}
                <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
        </div>
    );
}

// Grid of track card skeletons
export function TrackGridSkeleton({
    count = 8,
    className
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <TrackCardSkeleton key={i} />
            ))}
        </div>
    );
}