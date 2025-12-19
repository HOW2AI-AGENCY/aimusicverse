/**
 * Optimized Image Component
 * Lazy loading, responsive sizing, and format optimization
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLazyImage, generatePlaceholder, getOptimizedImageUrl } from '@/lib/imageOptimization';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Width in pixels (for aspect ratio calculation) */
  width?: number;
  /** Height in pixels (for aspect ratio calculation) */
  height?: number;
  /** Placeholder color */
  placeholderColor?: string;
  /** Priority loading (disables lazy loading) */
  priority?: boolean;
  /** Quality (1-100) */
  quality?: number;
  /** Object fit mode */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: () => void;
}

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  placeholderColor = '#1a1a2e',
  priority = false,
  quality = 80,
  objectFit = 'cover',
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const placeholder = React.useMemo(
    () => generatePlaceholder(width || 100, height || 100, placeholderColor),
    [width, height, placeholderColor]
  );

  const optimizedSrc = React.useMemo(
    () => getOptimizedImageUrl(src, { width, quality }),
    [src, width, quality]
  );

  const { ref, isLoaded, isError, currentSrc } = useLazyImage(
    priority ? optimizedSrc : optimizedSrc,
    {
      placeholder,
      rootMargin: '200px',
    }
  );

  React.useEffect(() => {
    if (isLoaded && onLoad) onLoad();
    if (isError && onError) onError();
  }, [isLoaded, isError, onLoad, onError]);

  // For priority images, load immediately
  if (priority) {
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          className
        )}
        loading="eager"
        decoding="async"
        {...props}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        !isLoaded && 'opacity-0',
        isLoaded && 'opacity-100',
        objectFit === 'cover' && 'object-cover',
        objectFit === 'contain' && 'object-contain',
        className
      )}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

/**
 * Avatar optimized for performance
 */
export interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
  className?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const sizeClassMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

export const OptimizedAvatar = React.memo(function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const pixelSize = sizeMap[size];

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center',
          sizeClassMap[size],
          className
        )}
        aria-label={alt}
      >
        {fallback || (
          <span className="text-muted-foreground text-sm font-medium">
            {alt.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      className={cn('rounded-full', sizeClassMap[size], className)}
      objectFit="cover"
      onError={() => setHasError(true)}
    />
  );
});

/**
 * Background image with lazy loading
 */
export interface LazyBackgroundProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const LazyBackground = React.memo(function LazyBackground({
  src,
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5,
}: LazyBackgroundProps) {
  const { ref, isLoaded, currentSrc } = useLazyImage(src, {
    rootMargin: '200px',
  });

  return (
    <div
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
      className={cn('relative bg-muted transition-opacity duration-500', className)}
      style={{
        backgroundImage: isLoaded ? `url(${currentSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlay && (
        <div
          className="absolute inset-0 bg-background"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
});
