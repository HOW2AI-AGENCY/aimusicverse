import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError || !src) {
    return (
      <div className={cn("bg-muted flex items-center justify-center", containerClassName)}>
        {fallback || (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Placeholder with blur */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted to-muted/50",
          "transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
      </div>

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-all duration-500 ease-out",
          isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}
