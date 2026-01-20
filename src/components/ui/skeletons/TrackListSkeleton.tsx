/**
 * Enhanced Skeleton Loading Components
 * Feature: Sprint 32 - US-009 Loading State Improvements
 *
 * High-quality skeleton loaders with shimmer animation
 * Match actual component layouts for better perceived performance
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shimmer animation CSS
 */
export const shimmer = 'shimmer';
export const shimmerClass = `
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.${shimmer} {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    hsl(var(--muted)) 0%,
    hsl(var(--muted-foreground) / 0.1) 20%,
    hsl(var(--muted)) 40%,
    hsl(var(--muted)) 100%
  );
  background-size: 1000px 100%;
}
`;

/**
 * Track Card Skeleton - Grid variant
 */
export const TrackCardSkeleton = memo(function TrackCardSkeleton({
  className,
  showCover = true,
  showMeta = true,
}: {
  className?: string;
  showCover?: boolean;
  showMeta?: boolean;
}) {
  return (
    <div
      className={cn(
        'space-y-2 p-3 rounded-xl bg-muted/30',
        className
      )}
    >
      {/* Cover image */}
      {showCover && (
        <Skeleton
          className={cn(
            'w-full aspect-square rounded-lg',
            shimmer
          )}
        />
      )}

      {/* Title */}
      <Skeleton className="h-4 w-3/4 rounded" />

      {/* Subtitle/Meta */}
      {showMeta && (
        <>
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        </>
      )}
    </div>
  );
});

/**
 * Track Row Skeleton - List variant
 */
export const TrackRowSkeleton = memo(function TrackRowSkeleton({
  className,
  showNumber = false,
}: {
  className?: string;
  showNumber?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg',
        className
      )}
    >
      {/* Number */}
      {showNumber && <Skeleton className="h-4 w-4 rounded" />}

      {/* Cover */}
      <Skeleton className={cn('w-12 h-12 rounded-md', shimmer)} />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
});

/**
 * Track List Skeleton - Multiple rows
 */
export const TrackListSkeleton = memo(function TrackListSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TrackRowSkeleton key={i} showNumber={false} />
      ))}
    </div>
  );
});

/**
 * Grid Skeleton - Multiple cards
 */
export const TrackGridSkeleton = memo(function TrackGridSkeleton({
  count = 8,
  columns = 2,
  className,
}: {
  count?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-3',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} showCover showMeta />
      ))}
    </div>
  );
});

/**
 * Hero Section Skeleton
 */
export const HeroSkeleton = memo(function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-muted/50 p-4 sm:p-6',
        className
      )}
    >
      {/* Background gradient placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-generate/10 rounded-2xl" />

      {/* Content */}
      <div className="relative z-10 space-y-3">
        {/* Badge */}
        <div className="flex justify-center">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="h-7 w-48 mx-auto rounded" />

        {/* Subtitle */}
        <Skeleton className="h-4 w-64 mx-auto rounded" />

        {/* Steps */}
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/60">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
});

/**
 * Section Header Skeleton
 */
export const SectionHeaderSkeleton = memo(function SectionHeaderSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-3.5 w-48 rounded" />
      </div>
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  );
});

/**
 * Featured Section Skeleton (horizontal scroll)
 */
export const FeaturedSectionSkeleton = memo(function FeaturedSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <SectionHeaderSkeleton />

      {/* Horizontal cards */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 w-28 space-y-2">
            <Skeleton className={cn('w-28 h-28 rounded-xl', shimmer)} />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Comments Section Skeleton
 */
export const CommentsSectionSkeleton = memo(function CommentsSectionSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>

      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
          {/* Avatar */}
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Playlist Card Skeleton
 */
export const PlaylistCardSkeleton = memo(function PlaylistCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg bg-muted/30',
        className
      )}
    >
      {/* Cover */}
      <Skeleton className={cn('w-16 h-16 rounded-lg', shimmer)} />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>

      {/* Actions */}
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
});

/**
 * Profile Header Skeleton
 */
export const ProfileHeaderSkeleton = memo(function ProfileHeaderSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Avatar + info */}
      <div className="flex items-center gap-3">
        <Skeleton className={cn('h-16 w-16 rounded-full', shimmer)} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Full Page Loading Skeleton
 */
export const PageSkeleton = memo(function PageSkeleton({
  showHeader = true,
  showHero = false,
  className,
}: {
  showHeader?: boolean;
  showHero?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )}

      {/* Hero */}
      {showHero && <HeroSkeleton />}

      {/* Sections */}
      <SectionHeaderSkeleton />
      <TrackGridSkeleton count={4} columns={2} />

      <SectionHeaderSkeleton />
      <TrackGridSkeleton count={4} columns={2} />
    </div>
  );
});

/**
 * Loading Shimmer Component
 * Animated gradient background
 */
export const LoadingShimmer = memo(function LoadingShimmer({
  className,
  height = '100%',
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        className
      )}
      style={{ height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
});

// Import motion from local lib for tree-shaking
import { motion } from '@/lib/motion';
