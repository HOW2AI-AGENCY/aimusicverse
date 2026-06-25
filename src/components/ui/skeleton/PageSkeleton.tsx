/**
 * PageSkeleton - Consistent page loading states
 * Feature: 032-professional-ui
 *
 * Provides standardized skeleton layouts that match final content dimensions
 * to prevent Cumulative Layout Shift (CLS)
 */

import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonText, SkeletonAvatar } from "../skeleton";

interface PageSkeletonProps {
  /** Skeleton layout variant */
  variant?: "home" | "list" | "detail" | "grid" | "form" | "studio";
  /** Number of list items to show */
  itemCount?: number;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * PageSkeleton - Matches exact layout dimensions of final content
 */
export const PageSkeleton = memo(function PageSkeleton({
  variant = "list",
  itemCount = 5,
  showHeader = true,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn("animate-in fade-in-0 duration-300", className)}>
      {showHeader && <HeaderSkeleton />}

      {variant === "home" && <HomeSkeleton />}
      {variant === "list" && <ListSkeleton count={itemCount} />}
      {variant === "detail" && <DetailSkeleton />}
      {variant === "grid" && <GridSkeleton count={itemCount} />}
      {variant === "form" && <FormSkeleton />}
      {variant === "studio" && <StudioSkeleton />}
    </div>
  );
});

// ========== Sub-components ==========

const HeaderSkeleton = memo(function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <SkeletonAvatar size="lg" />
      </div>
    </div>
  );
});

const HomeSkeleton = memo(function HomeSkeleton() {
  return (
    <div className="space-y-6 px-4">
      {/* Quick Create Card */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Stats Banner */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Section Header + Horizontal Scroll */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <SkeletonText lines={2} className="w-32" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px]">
              <Skeleton className="aspect-square rounded-xl mb-2" />
              <Skeleton className="h-3 w-4/5 mb-1" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
});

const ListSkeleton = memo(function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-card/50"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
});

const DetailSkeleton = memo(function DetailSkeleton() {
  return (
    <div className="space-y-6 px-4">
      {/* Cover Image */}
      <Skeleton className="aspect-square max-w-sm mx-auto rounded-2xl" />

      {/* Title & Meta */}
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>

      {/* Progress Bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
});

const GridSkeleton = memo(function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2" style={{ animationDelay: `${i * 30}ms` }}>
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
});

const FormSkeleton = memo(function FormSkeleton() {
  return (
    <div className="space-y-6 px-4 max-w-lg mx-auto">
      {/* Form Title */}
      <Skeleton className="h-8 w-48" />

      {/* Form Fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}

      {/* Submit Button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
});

const StudioSkeleton = memo(function StudioSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>

      {/* Waveform */}
      <div className="px-4 py-3 border-b">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 space-y-4">
        {/* Stem Tracks */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/50">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="flex-1 h-8 rounded-lg" />
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Player Bar */}
      <div className="p-4 border-t">
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
});

export default PageSkeleton;
