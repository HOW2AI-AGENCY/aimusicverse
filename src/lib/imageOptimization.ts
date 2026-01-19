/**
 * Image optimization utilities
 * Lazy loading, responsive images, format optimization, and caching
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { isSlowConnection, getAdaptiveQuality } from './performance';

/**
 * Image loading state
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * In-memory cache for preloaded images
 */
const imageCache = new Map<string, { loaded: boolean; timestamp: number }>();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cleanupCache() {
  if (imageCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    const entries = Array.from(imageCache.entries());
    // Remove oldest entries and expired ones
    entries
      .filter(([_, v]) => now - v.timestamp > CACHE_TTL)
      .slice(0, 20)
      .forEach(([key]) => imageCache.delete(key));
  }
}

function getCachedImage(src: string): boolean {
  const cached = imageCache.get(src);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.loaded;
  }
  return false;
}

function setCachedImage(src: string, loaded: boolean) {
  cleanupCache();
  imageCache.set(src, { loaded, timestamp: Date.now() });
}

/**
 * Hook for lazy loading images with intersection observer
 * Now with caching and priority support
 */
export function useLazyImage(
  src: string,
  options: {
    placeholder?: string;
    rootMargin?: string;
    threshold?: number;
    priority?: boolean;
  } = {}
): {
  ref: (node: HTMLImageElement | null) => void;
  isLoaded: boolean;
  isError: boolean;
  currentSrc: string;
} {
  const { 
    placeholder = '', 
    rootMargin = '200px', // Increased for earlier loading
    threshold = 0,
    priority = false 
  } = options;
  
  // Check cache first
  const isCached = useMemo(() => getCachedImage(src), [src]);
  
  const [loadState, setLoadState] = useState<ImageLoadState>(isCached ? 'loaded' : 'idle');
  const [currentSrc, setCurrentSrc] = useState(isCached ? src : placeholder);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLImageElement | null>(null);
  const mountedRef = useRef(true);

  const loadImage = useCallback(() => {
    if (!src || loadState !== 'idle') return;

    setLoadState('loading');

    const img = new Image();
    
    // Use decode() for smoother rendering
    img.onload = async () => {
      if (!mountedRef.current) return;
      
      try {
        // decode() ensures image is fully decoded before display
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // decode() failed, but image still loaded
      }
      
      if (mountedRef.current) {
        setCurrentSrc(src);
        setLoadState('loaded');
        setCachedImage(src, true);
      }
    };
    
    img.onerror = () => {
      if (mountedRef.current) {
        setLoadState('error');
        setCachedImage(src, false);
      }
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

      // Priority images or cached images load immediately
      if (priority || isCached) {
        if (isCached) {
          setCurrentSrc(src);
          setLoadState('loaded');
        } else {
          loadImage();
        }
        return;
      }

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
    [loadImage, rootMargin, threshold, priority, isCached, src]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      observerRef.current?.disconnect();
    };
  }, []);

  // Reset state when src changes
  useEffect(() => {
    const cached = getCachedImage(src);
    if (cached) {
      setCurrentSrc(src);
      setLoadState('loaded');
    } else {
      setLoadState('idle');
      setCurrentSrc(placeholder);
    }
  }, [src, placeholder]);

  return {
    ref,
    isLoaded: loadState === 'loaded',
    isError: loadState === 'error',
    currentSrc,
  };
}

/**
 * Generate responsive image srcset with optimized widths
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [160, 320, 480, 640, 960, 1280]
): string {
  if (!baseUrl) return '';
  
  // If URL is from Supabase storage, use its transformation params
  if (baseUrl.includes('supabase') && baseUrl.includes('/storage/')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return widths
      .map(w => `${baseUrl}${separator}width=${w}&quality=80 ${w}w`)
      .join(', ');
  }

  // For Suno CDN images
  if (baseUrl.includes('cdn1.suno.ai') || baseUrl.includes('cdn2.suno.ai')) {
    // Suno CDN doesn't support transforms, return original
    return baseUrl;
  }

  // For other URLs, just return the base URL
  return baseUrl;
}

/**
 * Get optimal image size based on container and device
 */
export function getOptimalImageSize(
  containerWidth: number,
  devicePixelRatio: number = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
): number {
  const sizes = [160, 320, 480, 640, 960, 1280, 1920];
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
let cachedFormat: 'avif' | 'webp' | 'jpg' | null = null;

export function getSupportedImageFormat(): 'avif' | 'webp' | 'jpg' {
  if (cachedFormat) return cachedFormat;
  if (typeof document === 'undefined') return 'jpg';

  // Check for AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    cachedFormat = 'avif';
    return 'avif';
  }

  // Check for WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    cachedFormat = 'webp';
    return 'webp';
  }

  cachedFormat = 'jpg';
  return 'jpg';
}

/**
 * Generate optimized image URL with format, size, and quality
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    format?: 'avif' | 'webp' | 'jpg' | 'auto';
    quality?: number;
  } = {}
): string {
  if (!originalUrl) return '';
  
  const { width, height, format = 'auto', quality = 80 } = options;
  
  // If it's a Supabase storage URL, use its transformation
  if (originalUrl.includes('supabase') && originalUrl.includes('/storage/')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (quality) params.set('quality', quality.toString());
    
    // Supabase supports resize mode
    if (width || height) {
      params.set('resize', 'cover');
    }
    
    const paramString = params.toString();
    if (!paramString) return originalUrl;
    
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${paramString}`;
  }

  // For other URLs, return as-is
  return originalUrl;
}

/**
 * Thumbnail URLs from cover_thumbnails table
 * Used for pre-generated WebP thumbnails
 * 
 * TODO: Integrate with track queries to fetch these alongside track data
 */
export interface ThumbnailUrls {
  small_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  blurhash?: string | null;
  dominant_color?: string | null;
}

/**
 * Get optimized cover URL for track cards
 * 
 * Priority:
 * 1. Pre-generated thumbnail (if available) - fastest, WebP
 * 2. On-the-fly Supabase transform - slower but works
 * 3. Original URL - fallback
 * 
 * @param coverUrl - Original cover URL from track
 * @param size - Thumbnail size preset
 * @param thumbnails - Optional pre-generated thumbnails from cover_thumbnails table
 * @returns Optimized image URL
 * 
 * TODO: Add srcset generation for responsive images
 * TODO: Consider using blurhash for instant placeholder
 */
export function getTrackCoverUrl(
  coverUrl: string | null | undefined,
  size: 'small' | 'medium' | 'large' = 'medium',
  thumbnails?: ThumbnailUrls | null
): string {
  if (!coverUrl) return '';
  
  // Priority 1: Use pre-generated thumbnail if available
  // These are already optimized WebP images stored in Supabase Storage
  if (thumbnails) {
    const thumbnailUrl = size === 'small' 
      ? thumbnails.small_url
      : size === 'medium' 
        ? thumbnails.medium_url
        : thumbnails.large_url;
    
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
  }
  
  // Priority 2: Fall back to on-the-fly transformation
  // Supabase Storage image transforms work but add latency
  const sizeMap = {
    small: { width: 160, quality: 70 },
    medium: { width: 320, quality: 80 },
    large: { width: 640, quality: 85 },
  };
  
  const { width, quality } = sizeMap[size];
  return getOptimizedImageUrl(coverUrl, { width, quality });
}

/**
 * Get dominant color from thumbnails for placeholder background
 * 
 * @param thumbnails - Thumbnail data from cover_thumbnails table
 * @returns Hex color string or default background color
 */
export function getThumbnailPlaceholderColor(
  thumbnails?: ThumbnailUrls | null
): string {
  return thumbnails?.dominant_color || 'hsl(var(--muted))';
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
 * Preload critical images with priority
 */
export function preloadImages(urls: string[], priority = false): Promise<void[]> {
  return Promise.all(
    urls.filter(Boolean).map(
      url =>
        new Promise<void>((resolve, reject) => {
          // Skip if already cached
          if (getCachedImage(url)) {
            resolve();
            return;
          }
          
          const img = new Image();
          
          // Use fetchpriority for critical images
          if (priority && 'fetchPriority' in img) {
            (img as any).fetchPriority = 'high';
          }
          
          img.onload = async () => {
            try {
              if ('decode' in img) {
                await img.decode();
              }
            } catch {}
            setCachedImage(url, true);
            resolve();
          };
          
          img.onerror = () => {
            setCachedImage(url, false);
            reject(new Error(`Failed to preload: ${url}`));
          };
          
          img.src = url;
        })
    )
  );
}

/**
 * Preload images that are likely to be viewed next
 */
export function preloadNextImages(currentIndex: number, allUrls: string[], count = 3) {
  const nextUrls = allUrls.slice(currentIndex + 1, currentIndex + 1 + count).filter(Boolean);
  if (nextUrls.length > 0) {
    // Use requestIdleCallback for non-critical preloading
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadImages(nextUrls, false).catch(() => {});
      });
    } else {
      setTimeout(() => {
        preloadImages(nextUrls, false).catch(() => {});
      }, 100);
    }
  }
}

/**
 * Hook for adaptive image quality based on network
 */
export function useAdaptiveImageQuality(): {
  quality: 'low' | 'medium' | 'high';
  shouldLazyLoad: boolean;
  maxWidth: number;
  qualityPercent: number;
} {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [shouldLazyLoad, setShouldLazyLoad] = useState(true);
  const [maxWidth, setMaxWidth] = useState(960);
  const [qualityPercent, setQualityPercent] = useState(80);

  useEffect(() => {
    const adaptiveQuality = getAdaptiveQuality();
    setQuality(adaptiveQuality);

    switch (adaptiveQuality) {
      case 'low':
        setShouldLazyLoad(true);
        setMaxWidth(480);
        setQualityPercent(60);
        break;
      case 'medium':
        setShouldLazyLoad(true);
        setMaxWidth(640);
        setQualityPercent(75);
        break;
      case 'high':
        setShouldLazyLoad(false);
        setMaxWidth(1280);
        setQualityPercent(90);
        break;
    }
  }, []);

  return { quality, shouldLazyLoad, maxWidth, qualityPercent };
}

/**
 * Hook for responsive images with srcset
 */
export function useResponsiveImage(src: string, containerRef?: React.RefObject<HTMLElement>) {
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const [srcSet, setSrcSet] = useState('');
  const { maxWidth, qualityPercent } = useAdaptiveImageQuality();

  useEffect(() => {
    if (!src) return;
    
    const containerWidth = containerRef?.current?.offsetWidth || 320;
    const optimalSize = getOptimalImageSize(containerWidth);
    
    setOptimizedSrc(getOptimizedImageUrl(src, { 
      width: Math.min(optimalSize, maxWidth), 
      quality: qualityPercent 
    }));
    
    setSrcSet(generateSrcSet(src));
  }, [src, containerRef, maxWidth, qualityPercent]);

  return { optimizedSrc, srcSet };
}
