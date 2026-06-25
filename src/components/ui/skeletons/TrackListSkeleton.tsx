/**
 * TrackListSkeleton - Loading skeleton for track lists
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackRowSkeletonProps {
    className?: string;
}

export function TrackRowSkeleton({ className }: TrackRowSkeletonProps) {
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

interface TrackListSkeletonProps {
    count?: number;
    className?: string;
}

export function TrackListSkeleton({ count = 5, className }: TrackListSkeletonProps) {
    return (
        <div className={cn("space-y-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <TrackRowSkeleton key={i} />
            ))}
        </div>
    );
}

interface TrackGridSkeletonProps {
    count?: number;
    className?: string;
}

export function TrackGridSkeleton({ count = 8, className }: TrackGridSkeletonProps) {
    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}

interface HeroSkeletonProps {
    className?: string;
}

export function HeroSkeleton({ className }: HeroSkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
                <Skeleton className="h-12 w-32 rounded-full" />
                <Skeleton className="h-12 w-32 rounded-full" />
            </div>
        </div>
    );
}

interface SectionHeaderSkeletonProps {
    className?: string;
}

export function SectionHeaderSkeleton({ className }: SectionHeaderSkeletonProps) {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-20" />
        </div>
    );
}

interface FeaturedSectionSkeletonProps {
    className?: string;
}

export function FeaturedSectionSkeleton({ className }: FeaturedSectionSkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <SectionHeaderSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="w-full aspect-video rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

interface CommentsSectionSkeletonProps {
    count?: number;
    className?: string;
}

export function CommentsSectionSkeleton({ count = 3, className }: CommentsSectionSkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface PlaylistCardSkeletonProps {
    className?: string;
}

export function PlaylistCardSkeleton({ className }: PlaylistCardSkeletonProps) {
    return (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg border border-border/50", className)}>
            <Skeleton className="w-16 h-16 rounded-md shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

interface ProfileHeaderSkeletonProps {
    className?: string;
}

export function ProfileHeaderSkeleton({ className }: ProfileHeaderSkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}

interface PageSkeletonProps {
    className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
    return (
        <div className={cn("space-y-6 p-6", className)}>
            <Skeleton className="h-8 w-1/3" />
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

interface LoadingShimmerProps {
    className?: string;
}

export function LoadingShimmer({ className }: LoadingShimmerProps) {
    return <Skeleton className={cn("animate-pulse", className)} />;
}

export const shimmer = "animate-pulse";
export const shimmerClass = "animate-pulse";