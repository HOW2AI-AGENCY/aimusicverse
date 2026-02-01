/**
 * PageSkeleton - Unified loading skeleton for all pages
 * Matches MainLayout structure to prevent content shifting
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PageSkeletonProps {
  /** Page type for optimized skeleton */
  variant?: 'default' | 'library' | 'projects' | 'settings' | 'profile' | 'studio';
  /** Show header skeleton */
  showHeader?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Unified page skeleton that matches MainLayout structure
 * Prevents layout shifts during page transitions
 */
export const PageSkeleton = memo(function PageSkeleton({
  variant = 'default',
  showHeader = true,
  className,
}: PageSkeletonProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  return (
    <div 
      className={cn(
        "min-h-screen bg-background animate-in fade-in duration-150",
        className
      )}
      style={{
        minHeight: 'var(--tg-viewport-stable-height, 100vh)',
      }}
    >
      {/* Header skeleton */}
      {showHeader && (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-32 sm:w-48 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Content skeleton based on variant */}
      {variant === 'library' && <LibraryContentSkeleton isDesktop={isDesktop} />}
      {variant === 'projects' && <ProjectsContentSkeleton isDesktop={isDesktop} />}
      {variant === 'settings' && <SettingsContentSkeleton isDesktop={isDesktop} />}
      {variant === 'profile' && <ProfileContentSkeleton />}
      {variant === 'studio' && <StudioContentSkeleton />}
      {variant === 'default' && <DefaultContentSkeleton isDesktop={isDesktop} />}
    </div>
  );
});

/** Default content skeleton */
function DefaultContentSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div className="space-y-6">
      {/* Hero/Banner skeleton */}
      <Skeleton className="h-32 sm:h-40 w-full rounded-xl" />
      
      {/* Section title */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      
      {/* Grid skeleton */}
      <div className={cn(
        "grid gap-3",
        isDesktop 
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          : "grid-cols-2"
      )}>
        {Array.from({ length: isDesktop ? 10 : 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Library page skeleton */
function LibraryContentSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div className="space-y-4">
      {/* Tabs/Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
      
      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-xl" />
      
      {/* Track list */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Projects page skeleton */
function ProjectsContentSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      
      {/* Project cards */}
      <div className={cn(
        "grid gap-4",
        isDesktop ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Settings page skeleton */
function SettingsContentSkeleton({ isDesktop }: { isDesktop: boolean }) {
  if (isDesktop) {
    return (
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-5 w-5 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Profile page skeleton */
function ProfileContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-4 py-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto rounded-lg" />
            <Skeleton className="h-3 w-16 mx-auto rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Content tabs */}
      <Skeleton className="h-10 w-full rounded-xl" />
      
      {/* Track list */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Studio page skeleton */
function StudioContentSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      
      {/* Waveform area */}
      <Skeleton className="h-24 w-full rounded-xl" />
      
      {/* Mixer/Tracks */}
      <div className="flex-1 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border/50">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export default PageSkeleton;
