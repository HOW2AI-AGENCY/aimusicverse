/**
 * Unified loading spinner component for consistent loading states
 * Feature: UX Improvements
 *
 * OPTIMIZED: Uses pure CSS animations instead of framer-motion
 * for faster initial paint and reduced JS bundle.
 */
import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Music2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "music" | "minimal" | "primary" | "muted" | "white";
  text?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const containerSizes = {
  xs: "p-1",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
  xl: "p-6",
};

const colorClasses = {
  default: "border-primary",
  primary: "border-primary",
  muted: "border-muted-foreground",
  white: "border-white",
  music: "border-primary",
  minimal: "border-primary",
};

export const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  variant = "default",
  text,
  className,
}: LoadingSpinnerProps) {
  // Minimal variant - pure CSS spinner
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "animate-spin rounded-full border-2 border-primary border-t-transparent",
          className,
        )}
        role="status"
        aria-label="Loading"
      />
    );
  }

  // Music variant - CSS pulse animation instead of framer-motion
  if (variant === "music") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div
          className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center css-pulse-scale",
            containerSizes[size],
          )}
          role="status"
          aria-label="Loading music"
        >
          <Music2 className={cn(sizeClasses[size], "text-primary")} />
        </div>
        {text && <p className="text-sm text-muted-foreground animate-fade-in">{text}</p>}
      </div>
    );
  }

  // Color variants - simple spinning loader
  if (variant === "muted" || variant === "white" || variant === "primary") {
    return (
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variant === "muted" && "text-muted-foreground",
          variant === "white" && "text-white",
          variant === "primary" && "text-primary",
          className,
        )}
      />
    );
  }

  // Default variant - simple CSS spinner
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(sizeClasses[size], "animate-spin rounded-full border-2 border-primary border-t-transparent")}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
});

// Section loading placeholder
interface SectionLoadingProps {
  height?: string;
  className?: string;
}

export function SectionLoading({ height = "120px", className }: SectionLoadingProps) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-lg bg-muted/30", className)}
      style={{ minHeight: height }}
    >
      <LoadingSpinner size="md" variant="default" />
    </div>
  );
}

/**
 * Full page loading overlay
 */
interface FullPageLoadingProps {
  /** Loading text */
  text?: string;
  /** Show music-themed animation */
  musicThemed?: boolean;
}

export const FullPageLoading = memo(function FullPageLoading({ text, musicThemed = false }: FullPageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <LoadingSpinner size="lg" variant={musicThemed ? "music" : "primary"} text={text} />
    </motion.div>
  );
});

/**
 * Inline loading indicator with text
 */
interface InlineLoadingProps {
  text?: string;
  size?: "sm" | "md";
  className?: string;
}

export const InlineLoading = memo(function InlineLoading({
  text = "Загрузка...",
  size = "sm",
  className,
}: InlineLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-muted-foreground",
        size === "sm" ? "text-sm" : "text-base",
        className,
      )}
    >
      <LoadingSpinner size={size === "sm" ? "xs" : "sm"} variant="muted" />
      <span>{text}</span>
    </div>
  );
});

/**
 * Dots loading animation
 */
export const LoadingDots = memo(function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
});

/**
 * Button loading state wrapper
 */
interface ButtonLoadingProps {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading = memo(function ButtonLoading({
  isLoading,
  children,
  loadingText,
  className,
}: ButtonLoadingProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size="xs" variant="muted" />
      {loadingText || children}
    </span>
  );
});

// Re-export consolidated skeletons from unified source
export { TrackCardSkeleton as CardSkeleton, TextSkeleton } from "./skeleton-components";
