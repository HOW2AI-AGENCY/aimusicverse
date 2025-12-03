/**
 * CDN Helper Functions
 * Sprint 010 Infrastructure - Phase 0
 *
 * Provides helper functions for CDN integration, image optimization,
 * and media caching to improve performance and reduce bandwidth costs.
 *
 * Supports:
 * - CDN URL generation with transformations
 * - Optimized image URLs with WebP/AVIF support
 * - Cache management and hit tracking
 * - Responsive image srcsets
 *
 * CDN Providers Supported:
 * - Supabase Storage (built-in transformations)
 * - Cloudflare Images (optional)
 * - Bunny CDN (optional)
 */

import { supabase } from "@/integrations/supabase/client";
import { getFileUrl } from "./storage";
import type { StorageBucket } from "./storage";

/**
 * CDN providers
 */
export const CDN_PROVIDERS = {
  SUPABASE: "supabase",
  CLOUDFLARE: "cloudflare",
  BUNNY: "bunny",
} as const;

export type CDNProvider = (typeof CDN_PROVIDERS)[keyof typeof CDN_PROVIDERS];

/**
 * Image formats supported by CDN
 */
export type ImageFormat = "webp" | "avif" | "jpeg" | "png" | "origin";

/**
 * Image fit modes
 */
export type ImageFit = "contain" | "cover" | "fill" | "inside" | "outside";

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: ImageFormat;
  fit?: ImageFit;
  blur?: number; // 0-100
  rotate?: number; // 0, 90, 180, 270
}

export interface CDNUrlOptions {
  bucket: StorageBucket;
  path: string;
  transform?: ImageTransformOptions;
  provider?: CDNProvider;
}

export interface ResponsiveImageOptions {
  bucket: StorageBucket;
  path: string;
  sizes: number[]; // e.g., [320, 640, 1024, 1920]
  format?: ImageFormat;
  quality?: number;
}

/**
 * Get current CDN provider from environment variables
 * Defaults to Supabase if not configured
 */
function getCDNProvider(): CDNProvider {
  const provider = import.meta.env.VITE_CDN_PROVIDER as CDNProvider | undefined;
  return provider || CDN_PROVIDERS.SUPABASE;
}

/**
 * Get CDN base URL for the configured provider
 */
function getCDNBaseUrl(): string | null {
  const provider = getCDNProvider();

  switch (provider) {
    case CDN_PROVIDERS.CLOUDFLARE:
      return import.meta.env.VITE_CLOUDFLARE_IMAGES_URL || null;
    case CDN_PROVIDERS.BUNNY:
      return import.meta.env.VITE_BUNNY_CDN_URL || null;
    case CDN_PROVIDERS.SUPABASE:
    default:
      return null; // Use Supabase storage URL
  }
}

/**
 * Get CDN URL for a file with optional transformations
 *
 * @param options - CDN URL options including bucket, path, and transformations
 * @returns CDN URL with transformations applied
 *
 * @example
 * ```typescript
 * const url = getCDNUrl({
 *   bucket: 'covers',
 *   path: 'user/track/cover.jpg',
 *   transform: {
 *     width: 512,
 *     height: 512,
 *     quality: 90,
 *     format: 'webp',
 *   },
 * });
 * ```
 */
export function getCDNUrl(options: CDNUrlOptions): string {
  const { bucket, path, transform, provider = getCDNProvider() } = options;

  const cdnBaseUrl = getCDNBaseUrl();

  // If using Supabase or no CDN configured, use Supabase storage with transformations
  if (provider === CDN_PROVIDERS.SUPABASE || !cdnBaseUrl) {
    return getFileUrl({
      bucket,
      path,
      transform: transform
        ? {
            width: transform.width,
            height: transform.height,
            quality: transform.quality,
            format: transform.format,
          }
        : undefined,
    });
  }

  // Build CDN URL for external providers
  const baseUrl = cdnBaseUrl.replace(/\/$/, "");
  const filePath = path.replace(/^\//, "");

  switch (provider) {
    case CDN_PROVIDERS.CLOUDFLARE: {
      // Cloudflare Images format: /cdn-cgi/image/width=512,quality=90/path
      const transformStr = transform
        ? Object.entries({
            width: transform.width,
            height: transform.height,
            quality: transform.quality,
            format: transform.format !== "origin" ? transform.format : undefined,
            fit: transform.fit,
            blur: transform.blur,
            rotate: transform.rotate,
          })
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join(",")
        : "";

      return transformStr
        ? `${baseUrl}/cdn-cgi/image/${transformStr}/${bucket}/${filePath}`
        : `${baseUrl}/${bucket}/${filePath}`;
    }

    case CDN_PROVIDERS.BUNNY: {
      // Bunny CDN format: ?width=512&quality=90
      const params = new URLSearchParams();

      if (transform) {
        if (transform.width) params.append("width", transform.width.toString());
        if (transform.height) params.append("height", transform.height.toString());
        if (transform.quality) params.append("quality", transform.quality.toString());
        if (transform.format && transform.format !== "origin") params.append("format", transform.format);
        if (transform.blur) params.append("blur", transform.blur.toString());
      }

      const queryString = params.toString();
      return queryString ? `${baseUrl}/${bucket}/${filePath}?${queryString}` : `${baseUrl}/${bucket}/${filePath}`;
    }

    default:
      return getFileUrl({ bucket, path, transform });
  }
}

/**
 * Get optimized image URL with automatic format selection
 * Automatically selects WebP or AVIF based on browser support
 *
 * @param bucket - Storage bucket
 * @param path - File path
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 *
 * @example
 * ```typescript
 * const url = getOptimizedImageUrl('covers', 'user/track/cover.jpg', 512, 512, 90);
 * ```
 */
export function getOptimizedImageUrl(
  bucket: StorageBucket,
  path: string,
  width?: number,
  height?: number,
  quality: number = 90,
): string {
  // Check browser support for modern formats
  const supportsWebP =
    typeof document !== "undefined" &&
    document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;

  const supportsAVIF =
    typeof document !== "undefined" &&
    document.createElement("canvas").toDataURL("image/avif").indexOf("data:image/avif") === 0;

  // Prefer AVIF > WebP > Original
  const format: ImageFormat = supportsAVIF ? "avif" : supportsWebP ? "webp" : "origin";

  return getCDNUrl({
    bucket,
    path,
    transform: {
      width,
      height,
      quality,
      format,
      fit: "cover",
    },
  });
}

/**
 * Generate responsive image srcset for different screen sizes
 *
 * @param options - Responsive image options including sizes
 * @returns Object with src and srcset strings
 *
 * @example
 * ```typescript
 * const { src, srcset } = getResponsiveImageSrcSet({
 *   bucket: 'covers',
 *   path: 'user/track/cover.jpg',
 *   sizes: [320, 640, 1024, 1920],
 *   format: 'webp',
 *   quality: 90,
 * });
 *
 * <img src={src} srcSet={srcset} />
 * ```
 */
export function getResponsiveImageSrcSet(options: ResponsiveImageOptions): {
  src: string;
  srcset: string;
  sizes: string;
} {
  const { bucket, path, sizes, format = "webp", quality = 90 } = options;

  // Generate URLs for each size
  const urls = sizes.map((size) => {
    const url = getCDNUrl({
      bucket,
      path,
      transform: {
        width: size,
        quality,
        format,
        fit: "cover",
      },
    });
    return `${url} ${size}w`;
  });

  // Default src is the middle size
  const defaultSize = sizes[Math.floor(sizes.length / 2)];
  const src = getCDNUrl({
    bucket,
    path,
    transform: {
      width: defaultSize,
      quality,
      format,
      fit: "cover",
    },
  });

  // Generate sizes attribute
  const sizesAttr = sizes
    .map((size, index) => {
      if (index === sizes.length - 1) {
        return `${size}px`;
      }
      return `(max-width: ${size}px) ${size}px`;
    })
    .join(", ");

  return {
    src,
    srcset: urls.join(", "),
    sizes: sizesAttr,
  };
}

/**
 * Track CDN cache hit for analytics
 *
 * @param originalUrl - Original file URL
 */
export async function trackCDNHit(originalUrl: string): Promise<void> {
  try {
    await supabase.rpc("increment_cdn_cache_hit", {
      asset_url: originalUrl,
    });
  } catch (error) {
    // Silently fail - tracking is non-critical
    console.warn("Failed to track CDN hit:", error);
  }
}

/**
 * Get CDN asset metadata from cache
 *
 * @param originalUrl - Original file URL
 * @returns CDN asset metadata if cached
 */
export async function getCDNAsset(originalUrl: string): Promise<{
  cdnUrl: string;
  assetType: string;
  cacheHitCount: number;
  lastAccessedAt: string;
  error?: string;
} | null> {
  try {
    const { data, error } = await supabase.from("cdn_assets").select("*").eq("original_url", originalUrl).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found - return null
        return null;
      }
      throw error;
    }

    return {
      cdnUrl: data.cdn_url,
      assetType: data.asset_type,
      cacheHitCount: data.cache_hit_count,
      lastAccessedAt: data.last_accessed_at,
    };
  } catch (error) {
    console.error("Error getting CDN asset:", error);
    return null;
  }
}

/**
 * Register a CDN asset in the cache
 *
 * @param originalUrl - Original file URL
 * @param cdnUrl - CDN URL
 * @param assetType - Type of asset (image, audio, video, other)
 * @param metadata - Additional metadata
 */
export async function registerCDNAsset(
  originalUrl: string,
  cdnUrl: string,
  assetType: "image" | "audio" | "video" | "other",
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    fileSizeBytes?: number;
  } = {},
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("cdn_assets").upsert(
      {
        original_url: originalUrl,
        cdn_url: cdnUrl,
        asset_type: assetType,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        file_size_bytes: metadata.fileSizeBytes,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: "original_url",
      },
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error registering CDN asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate thumbnail URL for an image
 *
 * @param bucket - Storage bucket
 * @param path - File path
 * @param size - Thumbnail size (default: 256)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(bucket: StorageBucket, path: string, size: number = 256): string {
  return getCDNUrl({
    bucket,
    path,
    transform: {
      width: size,
      height: size,
      quality: 85,
      format: "webp",
      fit: "cover",
    },
  });
}

/**
 * Generate blur placeholder URL for lazy loading
 *
 * @param bucket - Storage bucket
 * @param path - File path
 * @returns Blurred placeholder URL
 */
export function getBlurPlaceholderUrl(bucket: StorageBucket, path: string): string {
  return getCDNUrl({
    bucket,
    path,
    transform: {
      width: 40,
      height: 40,
      quality: 10,
      format: "webp",
      blur: 80,
      fit: "cover",
    },
  });
}

/**
 * Generate waveform thumbnail for audio files
 * This is a placeholder - actual implementation would require server-side processing
 *
 * @param bucket - Storage bucket
 * @param path - Audio file path
 * @param width - Waveform width
 * @param height - Waveform height
 * @returns Waveform image URL (placeholder for now)
 */
export function getWaveformUrl(bucket: StorageBucket, path: string, width: number = 800, height: number = 100): string {
  // TODO: Implement server-side waveform generation
  // For now, return a placeholder
  return `/api/waveform?bucket=${bucket}&path=${encodeURIComponent(path)}&width=${width}&height=${height}`;
}

/**
 * Preload critical images for better performance
 *
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load image with intersection observer
 *
 * @param imageElement - Image element to lazy load
 * @param src - Image source URL
 * @param placeholderSrc - Placeholder image URL
 */
export function lazyLoadImage(imageElement: HTMLImageElement, src: string, placeholderSrc?: string): void {
  if (typeof IntersectionObserver === "undefined") {
    // Fallback: load immediately
    imageElement.src = src;
    return;
  }

  // Set placeholder
  if (placeholderSrc) {
    imageElement.src = placeholderSrc;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          imageElement.src = src;
          observer.unobserve(imageElement);
        }
      });
    },
    {
      rootMargin: "50px",
    },
  );

  observer.observe(imageElement);
}
