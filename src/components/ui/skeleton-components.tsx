/**
 * Skeleton Components for Loading States
 *
 * Provide consistent loading experience across the application.
 * All skeletons use shimmer animation for visual feedback.
 *
 * @module skeleton-components
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Pre-computed waveform bar heights to keep render pure
const WAVEFORM_HEIGHTS = Array.from(
  { length: 50 },
  (_, i) => `${20 + Math.sin(i * 0.2) * 30 + Math.sin(i * 0.7) * 10}%`,
);

/**
 * Track Card Skeleton
 * Used in: Library, Home sections, Playlists
 *
 * @example
 * ```tsx
 * {isLoading && (
 *   <div className="grid grid-cols-2 gap-3">
 *     {Array.from({ length: 6 }).map((_, i) => (
 *       <TrackCardSkeleton key={i} index={i} />
 *     ))}
 *   </div>
 * )}
 * ```
 */
export function TrackCardSkeleton({
  variant = "default",
  className,
  index = 0,
}: {
  variant?: "default" | "compact" | "list" | "professional";
  className?: string;
  index?: number;
}) {
  // Stagger animation delay for smoother loading experience
  const staggerDelay = index * 50;
  const style = staggerDelay > 0 ? { animationDelay: `${staggerDelay}ms` } : undefined;

  // Compact variant for lists
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 p-2", className)} style={style}>
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
    );
  }

  // List variant for horizontal lists
  if (variant === "list") {
    return (
      <div className={cn("flex items-center gap-3 p-3 border-b border-border/30", className)} style={style}>
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
    );
  }

  // Professional variant with enhanced styling
  if (variant === "professional") {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)} style={style}>
        {/* Cover with overlay skeleton */}
        <div className="relative aspect-square">
          <Skeleton className="w-full h-full" />
          {/* Play button skeleton */}
          <div className="absolute bottom-2 right-2">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Default card variant (grid)
  return (
    <div className={cn("space-y-3 animate-in fade-in-50 duration-300", className)} style={style}>
      {/* Cover art */}
      <Skeleton className="aspect-square rounded-xl" />

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Track Card Skeleton - Compact variant for lists
 * @deprecated Use TrackCardSkeleton with variant="compact" instead
 */
export function TrackCardSkeletonCompact({ className, index = 0 }: { className?: string; index?: number }) {
  return <TrackCardSkeleton variant="compact" className={className} index={index} />;
}

/**
 * Player Skeleton
 * Used when loading track in player
 *
 * @example
 * ```tsx
 * <AnimatePresence mode="wait">
 *   {isLoadingTrack ? (
 *     <PlayerSkeleton />
 *   ) : (
 *     <Player track={track} />
 *   )}
 * </AnimatePresence>
 * ```
 */
export function PlayerSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 animate-in fade-in-50 duration-300">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 animate-in fade-in-50 duration-300">
      {/* Cover art */}
      <Skeleton className="aspect-square w-full rounded-2xl" />

      {/* Track info */}
      <div className="space-y-3 text-center">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full mt-4" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}

/**
 * List Item Skeleton
 * Generic skeleton for list items (projects, playlists, artists)
 */
export function ListItemSkeleton({ withAvatar = true, className }: { withAvatar?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 animate-in fade-in-50 duration-300", className)}>
      {withAvatar && <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Grid Container Skeleton
 * Renders multiple skeleton items in a grid
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <GridSkeleton count={6} columns={2} />
 * ) : (
 *   <TrackGrid tracks={tracks} />
 * )}
 * ```
 */
export function GridSkeleton({
  count = 6,
  columns = 2,
  SkeletonComponent = TrackCardSkeleton,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  SkeletonComponent?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-3`, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

/**
 * Carousel Skeleton
 * Horizontal scrolling skeleton for home page sections
 */
export function CarouselSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} className="min-w-[160px] flex-shrink-0" />
      ))}
    </div>
  );
}

/**
 * Horizontal Scroll Skeleton
 * For horizontal scroll areas with customizable item width
 */
export function HorizontalScrollSkeleton({
  count = 4,
  itemWidth = 140,
  aspectRatio = "square",
  className,
}: {
  count?: number;
  itemWidth?: number;
  aspectRatio?: "square" | "video" | "portrait";
  className?: string;
}) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2 -mx-3 px-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 space-y-2" style={{ width: `${itemWidth}px` } as React.CSSProperties}>
          <Skeleton className={cn("w-full rounded-xl", aspectClasses[aspectRatio])} />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Section Skeleton
 * Header + content skeleton for loading sections
 */
export function SectionSkeleton({
  headerWidth = 120,
  contentType = "grid",
  gridCount = 6,
  gridColumns = 2,
  className,
}: {
  headerWidth?: number;
  contentType?: "grid" | "carousel" | "list";
  gridCount?: number;
  gridColumns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-50 duration-300", className)}>
      <SectionHeaderSkeleton />

      {contentType === "grid" && <GridSkeleton count={gridCount} columns={gridColumns} />}

      {contentType === "carousel" && <CarouselSkeleton count={4} />}

      {contentType === "list" && (
        <div className="space-y-2">
          {Array.from({ length: gridCount }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section Header Skeleton
 * For section titles and action buttons
 */
export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-4 animate-in fade-in-50 duration-300", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

/**
 * Form Skeleton
 * For form loading states
 */
export function FormSkeleton({ fieldCount = 4 }: { fieldCount?: number }) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl mt-6" />
    </div>
  );
}

/**
 * Stats Widget Skeleton
 * For statistics and metrics displays
 */
export function StatsWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-4 p-4 rounded-xl border animate-in fade-in-50 duration-300", className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile Header Skeleton
 * For user profile loading
 */
export function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-50 duration-300", className)}>
      {/* Avatar */}
      <Skeleton className="w-24 h-24 rounded-full mx-auto" />

      {/* Name and bio */}
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Waveform Skeleton
 * For audio waveform loading
 */
export function WaveformSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-0.5 h-16 animate-in fade-in-50 duration-300", className)}>
      {WAVEFORM_HEIGHTS.map((height, i) => (
        <Skeleton key={i} className="flex-1 rounded-sm" style={{ height } as React.CSSProperties} />
      ))}
    </div>
  );
}

/**
 * Comments Section Skeleton
 * For loading comments
 */
export function CommentsSectionSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 animate-in fade-in-50 duration-300", className)}>
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
}

/**
 * Playlist Cover Skeleton
 * Circular variant for playlist covers
 */
export function PlaylistCoverSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 animate-in fade-in-50 duration-300", className)}>
      <Skeleton className="aspect-square rounded-2xl" />
      <Skeleton className="h-5 w-3/4 mx-auto" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
    </div>
  );
}

/**
 * Artist Card Skeleton
 * Circular avatar variant for artists
 */
export function ArtistCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 text-center animate-in fade-in-50 duration-300", className)}>
      <Skeleton className="aspect-square rounded-full mx-auto" />
      <Skeleton className="h-4 w-24 mx-auto" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}
/**
 * Text Skeleton - Single line text placeholder
 */
export function TextSkeleton({
  width = "100%",
  height = "1rem",
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <Skeleton className={cn("rounded", className)} style={{ width, height } as React.CSSProperties} />;
}

// ============================================
// STUDIO SKELETONS (migrated from StudioSkeletons.tsx)
// ============================================

/**
 * Track Row Skeleton for studio
 */
export function TrackRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 h-14 rounded-lg border border-border/30 bg-card/50 px-3 animate-in fade-in-50 duration-300",
        className,
      )}
    >
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <Skeleton className="w-20 h-4" />
      <div className="flex gap-1 ml-auto">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      <Skeleton className="flex-1 h-8 rounded" />
    </div>
  );
}

/**
 * Timeline Ruler Skeleton
 */
export function TimelineRulerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-6 border-b border-border/30 flex items-center gap-8 px-4 animate-in fade-in-50 duration-300",
        className,
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="w-8 h-3" />
      ))}
    </div>
  );
}

/**
 * Sections Skeleton
 */
export function SectionsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-7 border-b border-border/30 flex items-center gap-2 px-2 animate-in fade-in-50 duration-300",
        className,
      )}
    >
      <Skeleton className="w-16 h-5 rounded" />
      <Skeleton className="w-20 h-5 rounded" />
      <Skeleton className="w-14 h-5 rounded" />
      <Skeleton className="w-20 h-5 rounded" />
      <Skeleton className="w-16 h-5 rounded" />
    </div>
  );
}

/**
 * Transport Controls Skeleton
 */
export function TransportSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-t border-border/30 animate-in fade-in-50 duration-300",
        className,
      )}
    >
      <Skeleton className="w-24 h-4" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-10 h-10 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-20 h-2 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full Studio Loading Skeleton
 */
export function StudioLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col h-screen bg-background animate-in fade-in-50 duration-300", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-16 h-7 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded" />
          <Skeleton className="w-9 h-9 rounded" />
        </div>
      </div>
      <TimelineRulerSkeleton />
      <SectionsSkeleton />
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        <TrackRowSkeleton />
        <TrackRowSkeleton />
        <TrackRowSkeleton />
        <TrackRowSkeleton />
      </div>
      <TransportSkeleton />
    </div>
  );
}

/**
 * Mixer Panel Skeleton
 */
export function MixerPanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4 animate-in fade-in-50 duration-300", className)}>
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="flex-1 h-2 rounded-full" />
          <Skeleton className="w-10 h-4" />
        </div>
      </div>
      <div className="border-t border-border/30" />
      <div className="space-y-3">
        <Skeleton className="w-20 h-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 border border-border/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-4" />
              <div className="flex gap-1">
                <Skeleton className="w-7 h-7 rounded" />
                <Skeleton className="w-7 h-7 rounded" />
              </div>
            </div>
            <Skeleton className="w-full h-2 rounded-full" />
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// CONTENT SKELETONS (migrated from ContentSkeleton.tsx)
// ============================================

import { memo } from "react";

/**
 * Hero section skeleton
 */
export const HeroSkeleton = memo(function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
});

/**
 * Stats row skeleton
 */
export const StatsSkeleton = memo(function StatsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 rounded-2xl border border-border/60 bg-card p-3 space-y-1">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
});

/**
 * Horizontal scroll cards skeleton
 */
export const HorizontalCardsSkeleton = memo(function HorizontalCardsSkeleton({
  count = 4,
  cardWidth = "w-32",
  cardHeight = "h-40",
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
        <div key={i} className={cn("flex-shrink-0 rounded-2xl border border-border/60 bg-card p-3 space-y-2", cardWidth, cardHeight)}>
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </div>
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
        <Skeleton key={i} className={cn("h-8 flex-1 rounded-md", i === 0 && "bg-background")} />
      ))}
    </div>
  );
});

/**
 * Feed section skeleton with header + content
 */
export const FeedSectionSkeleton = memo(function FeedSectionSkeleton({
  headerWidth = "w-32",
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

// ============================================
// DOMAIN SKELETONS (migrated from skeleton-loader.tsx)
// ============================================

/**
 * Notification skeleton
 */
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

/**
 * Stem Studio skeleton loader
 */
export function StemStudioSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-20 h-8 rounded" />
            <Skeleton className="flex-1 h-16 rounded-lg" />
            <div className="flex gap-1">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 pt-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Generation form skeleton
 */
export function GenerationFormSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/**
 * Lyrics wizard skeleton
 */
export function LyricsWizardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            {i < 4 && <Skeleton className="w-12 h-0.5" />}
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Project detail skeleton
 */
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <Skeleton className="w-48 h-48 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-card/50">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-export base Skeleton component
export { Skeleton } from "./skeleton";
