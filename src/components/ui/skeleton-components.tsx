/**
 * Skeleton Components for Loading States
 * 
 * Provide consistent loading experience across the application.
 * All skeletons use shimmer animation for visual feedback.
 * 
 * @module skeleton-components
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Track Card Skeleton
 * Used in: Library, Home sections, Playlists
 * 
 * @example
 * ```tsx
 * {isLoading && (
 *   <div className="grid grid-cols-2 gap-3">
 *     {Array.from({ length: 6 }).map((_, i) => (
 *       <TrackCardSkeleton key={i} />
 *     ))}
 *   </div>
 * )}
 * ```
 */
export function TrackCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 animate-in fade-in-50 duration-300", className)}>
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
 */
export function TrackCardSkeletonCompact({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 animate-in fade-in-50 duration-300", className)}>
      {/* Cover thumbnail */}
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      {/* Action button */}
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>
  );
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
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
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
export function CarouselSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
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
  aspectRatio = 'square',
  className,
}: {
  count?: number;
  itemWidth?: number;
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
}) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2 -mx-3 px-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex-shrink-0 space-y-2"
          style={{ width: itemWidth }}
        >
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
  contentType = 'grid',
  gridCount = 6,
  gridColumns = 2,
  className,
}: {
  headerWidth?: number;
  contentType?: 'grid' | 'carousel' | 'list';
  gridCount?: number;
  gridColumns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-50 duration-300", className)}>
      <SectionHeaderSkeleton />
      
      {contentType === 'grid' && (
        <GridSkeleton count={gridCount} columns={gridColumns} />
      )}
      
      {contentType === 'carousel' && (
        <CarouselSkeleton count={4} />
      )}
      
      {contentType === 'list' && (
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
      {Array.from({ length: 50 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${20 + Math.sin(i * 0.2) * 30 + Math.random() * 20}%`,
          }}
        />
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
 * Card Skeleton - Generic card with cover and text
 * @deprecated Use TrackCardSkeleton or PlaylistCoverSkeleton instead
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg bg-muted/50 animate-pulse', className)}>
      <div className="aspect-square rounded-t-lg bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Text Skeleton - Single line text placeholder
 */
export function TextSkeleton({ 
  width = '100%', 
  height = '1rem',
  className 
}: { 
  width?: string; 
  height?: string;
  className?: string;
}) {
  return (
    <Skeleton 
      className={cn('rounded', className)}
      style={{ width, height }}
    />
  );
}
