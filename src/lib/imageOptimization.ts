/**
 * Image optimization utilities
 * Lazy loading, responsive images, and format optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { isSlowConnection, getAdaptiveQuality } from './performance';

/**
 * Image loading state
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Hook for lazy loading images with intersection observer
 */
export function useLazyImage(
  src: string,
  options: {
    placeholder?: string;
    rootMargin?: string;
    threshold?: number;
  } = {}
): {
  ref: (node: HTMLImageElement | null) => void;
  isLoaded: boolean;
  isError: boolean;
  currentSrc: string;
} {
  const { placeholder = '', rootMargin = '100px', threshold = 0 } = options;
  
  const [loadState, setLoadState] = useState<ImageLoadState>('idle');
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback(() => {
    if (!src || loadState !== 'idle') return;

    setLoadState('loading');

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setLoadState('loaded');
    };
    img.onerror = () => {
      setLoadState('error');
    };
    img.src = src;
  }, [src, loadState]);

  const ref = useCallback(
    (node: HTMLImageElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      elementRef.current = node;

      if (!node) return;

      // If IntersectionObserver is not supported, load immediately
      if (typeof IntersectionObserver === 'undefined') {
        loadImage();
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadImage();
              observerRef.current?.disconnect();
            }
          });
        },
        { rootMargin, threshold }
      );

      observerRef.current.observe(node);
    },
    [loadImage, rootMargin, threshold]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref,
    isLoaded: loadState === 'loaded',
    isError: loadState === 'error',
    currentSrc,
  };
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  // If URL is from Supabase storage, we can use transformation params
  if (baseUrl.includes('supabase') && baseUrl.includes('/storage/')) {
    return widths
      .map(w => `${baseUrl}?width=${w} ${w}w`)
      .join(', ');
  }

  // For other URLs, just return the base URL
  return baseUrl;
}

/**
 * Get optimal image size based on container and device
 */
export function getOptimalImageSize(
  containerWidth: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): number {
  const sizes = [320, 640, 960, 1280, 1920];
  const targetWidth = containerWidth * Math.min(devicePixelRatio, 2); // Cap at 2x

  // Find smallest size that's >= target
  for (const size of sizes) {
    if (size >= targetWidth) return size;
  }

  return sizes[sizes.length - 1];
}

/**
 * Image format detection and optimization
 */
export function getSupportedImageFormat(): 'avif' | 'webp' | 'jpg' {
  if (typeof document === 'undefined') return 'jpg';

  // Check for AVIF support
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }

  // Check for WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }

  return 'jpg';
}

/**
 * Generate optimized image URL with format and size
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    format?: 'avif' | 'webp' | 'jpg' | 'auto';
    quality?: number;
  } = {}
): string {
  const { width, format = 'auto', quality } = options;
  
  // If it's a Supabase storage URL, use its transformation
  if (originalUrl.includes('supabase') && originalUrl.includes('/storage/')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (quality) params.set('quality', quality.toString());
    
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params.toString()}`;
  }

  // For other URLs, return as-is
  return originalUrl;
}

/**
 * Placeholder generator for images
 */
export function generatePlaceholder(
  width: number,
  height: number,
  color = '#1a1a2e'
): string {
  // Return a tiny SVG data URL
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="${color}" width="100%" height="100%"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * BlurHash placeholder (simplified version)
 */
export function generateBlurPlaceholder(
  width = 32,
  height = 32,
  baseColor = 'hsl(240, 30%, 12%)'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <filter id="blur">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <rect fill="${baseColor}" width="100%" height="100%" filter="url(#blur)" />
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      url =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
          img.src = url;
        })
    )
  );
}

/**
 * Hook for adaptive image quality based on network
 */
export function useAdaptiveImageQuality(): {
  quality: 'low' | 'medium' | 'high';
  shouldLazyLoad: boolean;
  maxWidth: number;
} {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [shouldLazyLoad, setShouldLazyLoad] = useState(true);
  const [maxWidth, setMaxWidth] = useState(1280);

  useEffect(() => {
    const adaptiveQuality = getAdaptiveQuality();
    setQuality(adaptiveQuality);

    switch (adaptiveQuality) {
      case 'low':
        setShouldLazyLoad(true);
        setMaxWidth(640);
        break;
      case 'medium':
        setShouldLazyLoad(true);
        setMaxWidth(960);
        break;
      case 'high':
        setShouldLazyLoad(false); // Load immediately on fast connections
        setMaxWidth(1920);
        break;
    }
  }, []);

  return { quality, shouldLazyLoad, maxWidth };
}
