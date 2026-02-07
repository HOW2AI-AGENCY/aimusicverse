import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "rounded-md bg-muted/60 relative overflow-hidden isolate",
  {
    variants: {
      animation: {
        shimmer: "skeleton-shimmer-optimized",
        pulse: "animate-pulse",
        wave: "skeleton-wave",
        none: "opacity-60",
      },
      shape: {
        default: "rounded-md",
        circle: "rounded-full",
        card: "rounded-xl",
        pill: "rounded-full",
        square: "rounded-none",
      },
      intensity: {
        subtle: "bg-muted/40",
        normal: "bg-muted/60",
        strong: "bg-muted/80",
      },
    },
    defaultVariants: {
      animation: "shimmer",
      shape: "default",
      intensity: "normal",
    },
  }
);

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Match content height (useful for text lines) */
  lines?: number;
}

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
 * <Skeleton lines={3} /> // Multiple text lines
 */
function Skeleton({ className, animation, shape, intensity, lines, ...props }: SkeletonProps) {
  // Render multiple lines if specified
  if (lines && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              skeletonVariants({ animation, shape, intensity }), 
              "h-4",
              // Last line is shorter for natural text appearance
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )} 
            style={{
              willChange: 'auto',
              contain: 'layout paint',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn(skeletonVariants({ animation, shape, intensity }), className)} 
      style={{
        willChange: 'auto',
        contain: 'layout paint',
      }}
      {...props} 
    />
  );
}

/**
 * SkeletonText - Text-specific skeleton with proper line heights
 */
function SkeletonText({ 
  lines = 1, 
  className,
  lastLineWidth = '75%',
}: { 
  lines?: number; 
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className="h-4"
          style={{ 
            width: i === lines - 1 && lines > 1 ? lastLineWidth : '100%' 
          }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Circle skeleton for avatars
 */
function SkeletonAvatar({ 
  size = 'md',
  className,
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton 
      shape="circle" 
      className={cn(sizeClasses[size], className)} 
    />
  );
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
function SkeletonButton({ 
  size = 'default',
  className,
}: { 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-9 w-20',
    default: 'h-11 w-24',
    lg: 'h-12 w-28',
  };

  return (
    <Skeleton 
      shape="card" 
      className={cn(sizeClasses[size], className)} 
    />
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton,
  skeletonVariants 
};
