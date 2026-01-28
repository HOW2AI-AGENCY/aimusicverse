import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "rounded-md bg-muted/50 relative overflow-hidden",
  {
    variants: {
      animation: {
        shimmer: "skeleton-shimmer-optimized",
        pulse: "animate-pulse",
        none: "opacity-60",
      },
      shape: {
        default: "rounded-md",
        circle: "rounded-full",
        card: "rounded-lg",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      animation: "shimmer",
      shape: "default",
    },
  }
);

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Skeleton - Loading placeholder with optimized animation
 * 
 * Uses CSS-only animation for better scroll performance.
 * The shimmer effect is GPU-accelerated via translateX.
 * 
 * @example
 * <Skeleton className="h-4 w-full" />
 * <Skeleton shape="circle" className="h-10 w-10" />
 * <Skeleton animation="pulse" className="h-20 w-full" />
 */
function Skeleton({ className, animation, shape, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(skeletonVariants({ animation, shape }), className)} 
      style={{
        willChange: 'auto',
        contain: 'layout paint',
      }}
      {...props} 
    />
  );
}

export { Skeleton, skeletonVariants };
