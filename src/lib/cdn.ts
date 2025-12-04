/**
 * CDN Helper Functions
 * 
 * Provides helper functions for CDN integration, image optimization,
 * and media caching to improve performance and reduce bandwidth costs.
 */

import { supabase } from "@/integrations/supabase/client";

export const CDN_PROVIDERS = {
  SUPABASE: "supabase",
  CLOUDFLARE: "cloudflare",
  BUNNY: "bunny",
} as const;

export type CDNProvider = (typeof CDN_PROVIDERS)[keyof typeof CDN_PROVIDERS];

// Supabase only supports webp, avif, and origin
export type ImageFormat = "webp" | "avif" | "origin";

export type ImageFit = "contain" | "cover" | "fill" | "inside" | "outside";

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ImageFit;
}

export interface CDNUrlOptions {
  bucket: string;
  path: string;
  transform?: ImageTransformOptions;
  provider?: CDNProvider;
}

export interface ResponsiveImageOptions {
  bucket: string;
  path: string;
  sizes: number[];
  format?: ImageFormat;
  quality?: number;
}

function getCDNProvider(): CDNProvider {
  const provider = import.meta.env.VITE_CDN_PROVIDER as CDNProvider | undefined;
  return provider || CDN_PROVIDERS.SUPABASE;
}

function getCDNBaseUrl(): string | null {
  const provider = getCDNProvider();

  switch (provider) {
    case CDN_PROVIDERS.CLOUDFLARE:
      return import.meta.env.VITE_CLOUDFLARE_IMAGES_URL || null;
    case CDN_PROVIDERS.BUNNY:
      return import.meta.env.VITE_BUNNY_CDN_URL || null;
    case CDN_PROVIDERS.SUPABASE:
    default:
      return null;
  }
}

function getSupabaseStorageUrl(
  bucket: string,
  path: string,
  transform?: { width?: number; height?: number; quality?: number; format?: ImageFormat }
): string {
  // Supabase transform only supports 'origin' format - other formats handled by CDN
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: transform ? {
      width: transform.width,
      height: transform.height,
      quality: transform.quality,
      format: transform.format === "origin" ? "origin" : undefined,
    } : undefined,
  });
  return data.publicUrl;
}

export function getCDNUrl(options: CDNUrlOptions): string {
  const { bucket, path, transform, provider = getCDNProvider() } = options;

  const cdnBaseUrl = getCDNBaseUrl();

  if (provider === CDN_PROVIDERS.SUPABASE || !cdnBaseUrl) {
    return getSupabaseStorageUrl(bucket, path, transform);
  }

  const baseUrl = cdnBaseUrl.replace(/\/$/, "");
  const filePath = path.replace(/^\//, "");

  switch (provider) {
    case CDN_PROVIDERS.CLOUDFLARE: {
      const transformStr = transform
        ? Object.entries({
            width: transform.width,
            height: transform.height,
            quality: transform.quality,
            format: transform.format !== "origin" ? transform.format : undefined,
            fit: transform.fit,
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
      const params = new URLSearchParams();

      if (transform) {
        if (transform.width) params.append("width", transform.width.toString());
        if (transform.height) params.append("height", transform.height.toString());
        if (transform.quality) params.append("quality", transform.quality.toString());
        if (transform.format && transform.format !== "origin") params.append("format", transform.format);
      }

      const queryString = params.toString();
      return queryString ? `${baseUrl}/${bucket}/${filePath}?${queryString}` : `${baseUrl}/${bucket}/${filePath}`;
    }

    default:
      return getSupabaseStorageUrl(bucket, path);
  }
}

export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  width?: number,
  height?: number,
  quality: number = 90
): string {
  return getCDNUrl({
    bucket,
    path,
    transform: {
      width,
      height,
      quality,
      format: "webp",
      fit: "cover",
    },
  });
}

export function getResponsiveImageSrcSet(options: ResponsiveImageOptions): {
  src: string;
  srcset: string;
  sizes: string;
} {
  const { bucket, path, sizes, format = "webp", quality = 90 } = options;

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

export function getThumbnailUrl(bucket: string, path: string, size: number = 256): string {
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

export function getBlurPlaceholderUrl(bucket: string, path: string): string {
  return getCDNUrl({
    bucket,
    path,
    transform: {
      width: 40,
      height: 40,
      quality: 10,
      format: "webp",
      fit: "cover",
    },
  });
}

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

export function lazyLoadImage(imageElement: HTMLImageElement, src: string, placeholderSrc?: string): void {
  if (typeof IntersectionObserver === "undefined") {
    imageElement.src = src;
    return;
  }

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
    }
  );

  observer.observe(imageElement);
}
