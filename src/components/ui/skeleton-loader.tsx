import { Card } from "./card";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

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

// ============================================================================
// Phase 5: Additional skeleton loaders for comprehensive coverage
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

/**
 * Adaptive skeleton that respects reduced motion preferences
 */
interface AdaptiveSkeletonProps {
  className?: string;
  animated?: boolean;
}

export function AdaptiveSkeleton({ className, animated = true }: AdaptiveSkeletonProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <Skeleton 
      className={cn(
        className,
        !animated || prefersReducedMotion ? 'animate-none' : ''
      )} 
    />
  );
}
