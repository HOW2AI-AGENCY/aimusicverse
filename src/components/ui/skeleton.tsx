import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use shimmer animation (default: true, set false for simpler pulse) */
  shimmer?: boolean;
}

/**
 * Skeleton - Loading placeholder with optimized animation
 * 
 * Uses CSS-only animation for better scroll performance.
 * The shimmer effect is GPU-accelerated via translateX.
 */
function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-md bg-muted/50 relative overflow-hidden",
        // Use simpler animation on mobile for better scroll performance
        shimmer ? "skeleton-shimmer-optimized" : "opacity-60",
        className
      )} 
      style={{
        // GPU acceleration hint - prevents repaints during scroll
        willChange: 'auto',
        contain: 'layout paint',
      }}
      {...props} 
    />
  );
}

export { Skeleton };
