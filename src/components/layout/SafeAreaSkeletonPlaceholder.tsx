import { forwardRef, type HTMLAttributes } from "react";
import { SafeAreaContainer } from "./SafeAreaContainer";
import { cn } from "@/lib/utils";

interface SafeAreaSkeletonPlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual layout of placeholders */
  layout?: "grid" | "list" | "carousel";
  /** Number of skeleton items */
  count?: number;
  /** Tailwind grid columns for grid layout (defaults to mobile 2 / sm 3 / lg 4) */
  gridCols?: string;
}

/**
 * Unified skeleton wrapper.
 *
 * Wraps any skeleton grid/list in a `SafeAreaContainer` so every screen
 * (Library, Home, Profile, Generate, etc.) shares the same notch-aware,
 * RTL-symmetric gutters with no double-padding. Drop this around generated
 * placeholder children to guarantee identical edge spacing across pages.
 *
 * Marked with `data-safe-skeleton` so `SafeAreaDebugOverlay` can highlight
 * its bounding box during diagnostics.
 */
export const SafeAreaSkeletonPlaceholder = forwardRef<HTMLDivElement, SafeAreaSkeletonPlaceholderProps>(
  ({ layout = "grid", count = 6, gridCols, className, children, ...rest }, ref) => {
    const layoutClass =
      layout === "grid"
        ? cn("grid gap-3", gridCols ?? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")
        : layout === "list"
          ? "flex flex-col gap-1.5"
          : "flex gap-3 overflow-x-auto pb-2";

    return (
      <SafeAreaContainer sides={["left", "right"]} minPaddingRem={0} className={cn("w-full", className)}>
        <div ref={ref} data-safe-skeleton="" className={layoutClass} {...rest}>
          {children ??
            Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse rounded-xl bg-muted/40",
                  layout === "list" ? "h-14 w-full" : "aspect-square w-full",
                )}
              />
            ))}
        </div>
      </SafeAreaContainer>
    );
  },
);
SafeAreaSkeletonPlaceholder.displayName = "SafeAreaSkeletonPlaceholder";
