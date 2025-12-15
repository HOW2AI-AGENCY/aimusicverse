import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: "track" | "project" | "artist" | "playlist";
  /** Show in grid or list view */
  view?: "grid" | "list";
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, variant = "track", view = "grid", ...props }, ref) => {
    if (view === "list") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-card/50 animate-pulse",
            className
          )}
          {...props}
        >
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>
      );
    }

    if (variant === "artist") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/50 animate-pulse",
            className
          )}
          {...props}
        >
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="w-full space-y-2 text-center">
            <Skeleton className="h-4 w-2/3 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        </div>
      );
    }

    if (variant === "playlist") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-3 p-4 rounded-2xl bg-card/50 animate-pulse",
            className
          )}
          {...props}
        >
          <div className="grid grid-cols-2 gap-1 aspect-square rounded-xl overflow-hidden">
            <Skeleton className="w-full h-full" />
            <Skeleton className="w-full h-full" />
            <Skeleton className="w-full h-full" />
            <Skeleton className="w-full h-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
    }

    // Default track/project card
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 p-3 rounded-2xl bg-card/50 animate-pulse",
          className
        )}
        {...props}
      >
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-2 px-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";

// Multiple skeleton cards
interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  variant?: "track" | "project" | "artist" | "playlist";
  view?: "grid" | "list";
}

export const SkeletonGrid = React.forwardRef<HTMLDivElement, SkeletonGridProps>(
  ({ className, count = 6, variant = "track", view = "grid", ...props }, ref) => {
    if (view === "list") {
      return (
        <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} variant={variant} view="list" />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
          className
        )}
        {...props}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} variant={variant} view="grid" />
        ))}
      </div>
    );
  }
);

SkeletonGrid.displayName = "SkeletonGrid";
