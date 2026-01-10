/**
 * Mobile Skeleton Components
 *
 * Mobile-optimized skeleton loading states with proper touch targets,
 * reduced skeleton count for better performance, and optimized animations.
 *
 * @module mobile/skeletons
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Mobile Track Card Skeleton - Optimized for mobile grid
 * Reduced size and proper mobile dimensions (44px+ touch targets)
 */
export function MobileTrackCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2 animate-in fade-in-50 duration-300", className)}>
      {/* Cover art - square aspect ratio */}
      <Skeleton className="aspect-square rounded-xl w-full" />

      {/* Title - shorter for mobile */}
      <div className="space-y-1.5 px-0.5">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* Metadata - minimal for mobile */}
      <div className="flex items-center gap-1.5 px-0.5">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

/**
 * Mobile Track List Skeleton - For list view on mobile
 * Matches MobileListItem dimensions (min-h-[56px])
 */
export function MobileTrackListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2.5 min-h-[56px] animate-in fade-in-50 duration-300",
      className
    )}>
      {/* Thumbnail */}
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>

      {/* Action button - 44px touch target */}
      <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
    </div>
  );
}

/**
 * Mobile Section Skeleton - For horizontal scrolling sections
 * Shows 3 items instead of 4 for mobile
 */
export function MobileSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 animate-in fade-in-50 duration-300", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>

      {/* Horizontal scroll items */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 space-y-1.5" style={{ width: 140 }}>
            <Skeleton className="aspect-square rounded-xl w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mobile Hero Skeleton - For hero sections on mobile
 */
export function MobileHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl bg-gradient-to-br from-primary/10 to-background p-5 animate-in fade-in-50 duration-300",
      className
    )}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-48" />
        <div className="flex gap-2 mt-3 w-full justify-center">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile List Skeleton - Shows 5 items instead of 8 for better performance
 */
export function MobileListSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5 animate-in fade-in-50 duration-300", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MobileTrackListSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Mobile Grid Skeleton - Shows 4 items in 2x2 grid for mobile
 */
export function MobileGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-2 gap-3 animate-in fade-in-50 duration-300",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <MobileTrackCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Mobile Studio Track Skeleton - For studio tracks on mobile
 */
export function MobileStudioTrackSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 min-h-[60px] rounded-lg border border-border/30 bg-card/50 animate-in fade-in-50 duration-300",
      className
    )}>
      {/* Track icon */}
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />

      {/* Track info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
        <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * Mobile Player Skeleton - For mobile player loading
 */
export function MobilePlayerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4 animate-in fade-in-50 duration-300", className)}>
      {/* Cover art */}
      <Skeleton className="aspect-square w-full rounded-2xl" />

      {/* Track info */}
      <div className="space-y-2 text-center">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-3.5 w-1/2 mx-auto" />
      </div>

      {/* Progress bar */}
      <Skeleton className="h-1.5 w-full rounded-full" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <Skeleton className="w-11 h-11 rounded-full" />
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Mobile Form Field Skeleton - For form loading states
 */
export function MobileFormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2 animate-in fade-in-50 duration-300", className)}>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

/**
 * Mobile Form Skeleton - Complete form with multiple fields
 */
export function MobileFormSkeleton({ fieldCount = 3, className }: { fieldCount?: number; className?: string }) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-50 duration-300", className)}>
      {Array.from({ length: fieldCount }).map((_, i) => (
        <MobileFormFieldSkeleton key={i} />
      ))}
      <Skeleton className="h-12 w-full rounded-xl mt-2" />
    </div>
  );
}

/**
 * Mobile Stats Skeleton - For stats displays
 */
export function MobileStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-3 gap-2 p-3 rounded-xl border animate-in fade-in-50 duration-300",
      className
    )}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-1.5">
          <Skeleton className="h-7 w-14 mx-auto" />
          <Skeleton className="h-2.5 w-10 mx-auto" />
        </div>
      ))}
    </div>
  );
}
