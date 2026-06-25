/**
 * ProgressiveImage - Image with loading states and blurhash
 * Feature: UX Improvements
 *
 * Provides smooth image loading with placeholder and error states
 */

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ImageOff } from "@/lib/icons";
import { interactive } from "@/lib/overlay-colors";

interface ProgressiveImageProps {
  src: string | null | undefined;
  alt: string;
  /** Fallback icon or element */
  fallback?: React.ReactNode;
  /** Aspect ratio */
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Size constraint */
  size?: "sm" | "md" | "lg" | "full";
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill";
  /** Additional className */
  className?: string;
  /** Enable hover zoom effect */
  hoverZoom?: boolean;
  /** Lazy loading */
  lazy?: boolean;
  /** Dominant color for placeholder (hex) */
  dominantColor?: string;
  /** onClick handler */
  onClick?: () => void;
}

export const ProgressiveImage = memo(function ProgressiveImage({
  src,
  alt,
  fallback,
  aspectRatio = "square",
  rounded = "lg",
  size = "full",
  objectFit = "cover",
  className,
  hoverZoom = false,
  lazy = true,
  dominantColor,
  onClick,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    full: "w-full h-full",
  };

  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  };

  const showFallback = !src || hasError;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30",
        aspectClasses[aspectRatio],
        roundedClasses[rounded],
        size !== "full" && sizeClasses[size],
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      style={{
        backgroundColor: !isLoaded && dominantColor ? dominantColor : undefined,
      }}
    >
      {/* Placeholder shimmer */}
      <AnimatePresence>
        {!isLoaded && !showFallback && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-muted/50 skeleton-shimmer-optimized"
          />
        )}
      </AnimatePresence>

      {/* Actual image */}
      {!showFallback && (
        <motion.img
          src={src!}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "w-full h-full",
            objectFitClasses[objectFit],
            hoverZoom && "transition-transform duration-300 group-hover:scale-105",
          )}
        />
      )}

      {/* Fallback state */}
      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          {fallback || <ImageOff className="w-1/4 h-1/4 text-muted-foreground/50" />}
        </div>
      )}

      {/* Hover overlay for clickable images */}
      {onClick && hoverZoom && (
        <div className={cn("absolute inset-0 transition-colors duration-200", interactive.hover)} />
      )}
    </div>
  );
});

/**
 * Avatar with progressive loading
 */
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarImageProps extends Omit<ProgressiveImageProps, "aspectRatio" | "rounded" | "size"> {
  size?: AvatarSize;
  /** Initials to show as fallback */
  initials?: string;
}

export const AvatarImage = memo(function AvatarImage({ size = "md", initials, fallback, ...props }: AvatarImageProps) {
  const sizeClasses: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-xl",
  };

  const avatarFallback = initials ? (
    <span className="font-medium text-muted-foreground">{initials.slice(0, 2).toUpperCase()}</span>
  ) : (
    fallback
  );

  return (
    <ProgressiveImage
      aspectRatio="square"
      rounded="full"
      className={sizeClasses[size]}
      fallback={avatarFallback}
      {...props}
    />
  );
});

export default ProgressiveImage;
