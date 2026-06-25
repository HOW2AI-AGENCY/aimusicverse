/**
 * Shimmer Effect Component
 * Feature: 032-professional-ui
 *
 * Animated shimmer overlay for loading states.
 * GPU-accelerated for smooth animations.
 */

import { memo } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shimmer animation duration in seconds */
  duration?: number;
  /** Show shimmer (for conditional rendering) */
  active?: boolean;
  /** Children to overlay with shimmer */
  children?: React.ReactNode;
}

/**
 * Shimmer - Animated loading overlay
 *
 * @example
 * // As overlay on content
 * <div className="relative">
 *   <Image src={src} />
 *   <Shimmer active={isLoading} />
 * </div>
 *
 * // As standalone placeholder
 * <Shimmer className="h-32 w-full rounded-xl" />
 */
export const Shimmer = memo(function Shimmer({
  className,
  duration = 1.5,
  active = true,
  children,
  ...props
}: ShimmerProps) {
  if (!active) return <>{children}</>;

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          willChange: "transform",
        }}
      />
    </div>
  );
});

/**
 * ShimmerBlock - Standalone shimmer placeholder
 */
export const ShimmerBlock = memo(function ShimmerBlock({
  className,
  height = 100,
  width,
  rounded = "xl",
}: {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <Shimmer
      className={cn("bg-muted/50", roundedClass, className)}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
      }}
    />
  );
});

/**
 * ShimmerText - Text line placeholder with shimmer
 */
export const ShimmerText = memo(function ShimmerText({
  lines = 1,
  width = "100%",
  className,
}: {
  lines?: number;
  width?: string | string[];
  className?: string;
}) {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width);

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBlock key={i} height={16} width={widths[i] || "100%"} rounded="md" />
      ))}
    </div>
  );
});

/**
 * ShimmerAvatar - Circle avatar placeholder
 */
export const ShimmerAvatar = memo(function ShimmerAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <ShimmerBlock height={size} width={size} rounded="full" className={className} />;
});

export default Shimmer;
