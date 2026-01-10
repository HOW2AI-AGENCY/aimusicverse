/**
 * Skeleton Loader - Domain-specific skeletons
 * 
 * Re-exports unified skeletons from skeleton-components.tsx
 * Plus domain-specific skeletons for complex pages
 */

import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

// Re-export common skeletons from unified source
export { 
  TrackCardSkeleton,
  TrackCardSkeletonCompact,
  PlayerSkeleton,
  ListItemSkeleton,
  GridSkeleton,
  SectionSkeleton,
  SectionHeaderSkeleton,
  ProfileHeaderSkeleton,
  WaveformSkeleton,
} from './skeleton-components';

// ============================================================================
// Domain-specific skeletons
// ============================================================================

/**
 * Stem Studio skeleton loader
 */
export function StemStudioSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Waveform area */}
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
      
      {/* Controls */}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Mode tabs */}
      <Skeleton className="h-10 w-full rounded-lg" />
      
      {/* Form fields */}
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
      
      {/* Generate button */}
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
      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            {i < 4 && <Skeleton className="w-12 h-0.5" />}
          </div>
        ))}
      </div>
      
      {/* Content area */}
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
      
      {/* Navigation */}
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
      {/* Header */}
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
      
      {/* Track list */}
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

// NotificationSkeleton - still used in NotificationList.tsx
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
