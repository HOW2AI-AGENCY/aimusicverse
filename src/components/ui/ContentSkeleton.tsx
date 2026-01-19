/**
 * ContentSkeleton - Generic content loading skeletons
 * For various UI sections like headers, stats, sections
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Hero section skeleton
 */
export const HeroSkeleton = memo(function HeroSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </Card>
  );
});

/**
 * Stats row skeleton
 */
export const StatsSkeleton = memo(function StatsSkeleton({ 
  count = 3,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex-1 p-3 space-y-1">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </Card>
      ))}
    </div>
  );
});

/**
 * Section header skeleton
 */
export const SectionHeaderSkeleton = memo(function SectionHeaderSkeleton({ 
  className 
}: { 
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
});

/**
 * Horizontal scroll cards skeleton
 */
export const HorizontalCardsSkeleton = memo(function HorizontalCardsSkeleton({
  count = 4,
  cardWidth = 'w-32',
  cardHeight = 'h-40',
  className,
}: {
  count?: number;
  cardWidth?: string;
  cardHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className={cn("flex-shrink-0 p-3 space-y-2", cardWidth, cardHeight)}>
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </Card>
      ))}
    </div>
  );
});

/**
 * Tab bar skeleton
 */
export const TabBarSkeleton = memo(function TabBarSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 p-1 bg-muted/50 rounded-lg", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-8 flex-1 rounded-md",
            i === 0 && "bg-background"
          )} 
        />
      ))}
    </div>
  );
});

/**
 * Feed section skeleton with header + content
 */
export const FeedSectionSkeleton = memo(function FeedSectionSkeleton({
  headerWidth = 'w-32',
  children,
  className,
}: {
  headerWidth?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <SectionHeaderSkeleton />
      {children}
    </div>
  );
});
