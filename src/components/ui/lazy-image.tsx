import { useState, useCallback, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getTrackCoverUrl, generateSrcSet } from "@/lib/imageOptimization";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
  /** Optimize for track cover sizes */
  coverSize?: 'small' | 'medium' | 'large';
  /** Priority loading (above the fold) */
  priority?: boolean;
  /** Enable srcset for responsive images */
  responsive?: boolean;
  /** Aspect ratio for container (e.g., "1/1", "16/9") */
  aspectRatio?: string;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  coverSize,
  priority = false,
  responsive = false,
  aspectRatio,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);

  // Get optimized URL
  const optimizedSrc = coverSize 
    ? getTrackCoverUrl(src, coverSize)
    : getOptimizedImageUrl(src, { quality: 80 });

  // Generate srcset for responsive images
  const srcSet = responsive ? generateSrcSet(src) : undefined;
  
  // Default sizes attribute for responsive images
  const sizes = responsive 
    ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    : undefined;

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || shouldLoad) return;
    
    const element = imgRef.current;
    if (!element) return;

    // Check if already in viewport
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before entering viewport
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, shouldLoad]);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError || !src) {
    return (
      <div 
        className={cn("bg-muted flex items-center justify-center", containerClassName)}
        role="img"
        aria-label={alt || "Изображение недоступно"}
      >
        {fallback || (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder with shimmer - only show while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50"
          aria-hidden="true"
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={shouldLoad ? optimizedSrc : undefined}
        srcSet={shouldLoad && srcSet ? srcSet : undefined}
        sizes={sizes}
        data-src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-slow ease-default",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
});

// Re-export for backwards compatibility
export { LazyImage as default };
