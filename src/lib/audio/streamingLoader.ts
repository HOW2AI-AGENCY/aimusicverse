/**
 * Streaming Audio Loader
 * 
 * Advanced audio loading with Range requests, adaptive buffering,
 * and progressive loading for faster playback start.
 */

import { logger } from '@/lib/logger';

const log = logger.child({ module: 'StreamingLoader' });

interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface StreamingLoaderOptions {
  chunkSize?: number; // Bytes per chunk
  initialBufferSize?: number; // Initial bytes to load before playback
  enableRangeRequests?: boolean;
  onProgress?: (progress: LoadProgress) => void;
  signal?: AbortSignal;
}

const DEFAULT_OPTIONS: Required<Omit<StreamingLoaderOptions, 'onProgress' | 'signal'>> = {
  chunkSize: 256 * 1024, // 256KB chunks
  initialBufferSize: 512 * 1024, // 512KB initial buffer
  enableRangeRequests: true,
};

/**
 * Check if server supports Range requests
 */
export async function checkRangeSupport(url: string): Promise<{
  supports: boolean;
  contentLength: number;
  contentType: string;
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    
    const acceptRanges = response.headers.get('Accept-Ranges');
    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
    
    return {
      supports: acceptRanges === 'bytes' && contentLength > 0,
      contentLength,
      contentType,
    };
  } catch (error) {
    log.warn('Range support check failed', { url: url.substring(0, 50), error });
    return { supports: false, contentLength: 0, contentType: 'audio/mpeg' };
  }
}

/**
 * Load audio with progressive loading for fast start
 */
export async function loadAudioProgressive(
  url: string,
  options: StreamingLoaderOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { chunkSize, initialBufferSize, enableRangeRequests, onProgress, signal } = opts;
  
  // Check if blob URL or data URL - load directly
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const response = await fetch(url, { signal });
    return response.blob();
  }
  
  // Check Range request support
  if (enableRangeRequests) {
    const rangeInfo = await checkRangeSupport(url);
    
    if (rangeInfo.supports) {
      return loadWithRangeRequests(url, rangeInfo.contentLength, rangeInfo.contentType, {
        chunkSize,
        initialBufferSize,
        onProgress,
        signal,
      });
    }
  }
  
  // Fallback to standard fetch
  return loadWithStandardFetch(url, { onProgress, signal });
}

/**
 * Load audio using Range requests for progressive loading
 */
async function loadWithRangeRequests(
  url: string,
  totalSize: number,
  contentType: string,
  options: {
    chunkSize: number;
    initialBufferSize: number;
    onProgress?: (progress: LoadProgress) => void;
    signal?: AbortSignal;
  }
): Promise<Blob> {
  const { chunkSize, onProgress, signal } = options;
  
  log.debug('Starting Range request loading', { 
    url: url.substring(0, 50), 
    totalSize,
    chunkSize 
  });
  
  const chunks: ArrayBuffer[] = [];
  let loadedBytes = 0;
  
  // Load in chunks
  while (loadedBytes < totalSize) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    const start = loadedBytes;
    const end = Math.min(loadedBytes + chunkSize - 1, totalSize - 1);
    
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${start}-${end}`,
      },
      signal,
    });
    
    if (!response.ok && response.status !== 206) {
      throw new Error(`Range request failed: ${response.status}`);
    }
    
    const chunk = await response.arrayBuffer();
    chunks.push(chunk);
    loadedBytes += chunk.byteLength;
    
    onProgress?.({
      loaded: loadedBytes,
      total: totalSize,
      percentage: (loadedBytes / totalSize) * 100,
    });
  }
  
  // Combine chunks into single blob
  return new Blob(chunks, { type: contentType });
}

/**
 * Load audio with standard fetch (fallback)
 */
async function loadWithStandardFetch(
  url: string,
  options: {
    onProgress?: (progress: LoadProgress) => void;
    signal?: AbortSignal;
  }
): Promise<Blob> {
  const { onProgress, signal } = options;
  
  const response = await fetch(url, { signal });
  
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  
  // If we can get content length, track progress
  const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
  
  if (contentLength > 0 && response.body) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      loadedBytes += value.length;
      
      onProgress?.({
        loaded: loadedBytes,
        total: contentLength,
        percentage: (loadedBytes / contentLength) * 100,
      });
    }
    
    const combined = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return new Blob([combined], { 
      type: response.headers.get('Content-Type') || 'audio/mpeg' 
    });
  }
  
  // No content length - simple blob
  return response.blob();
}

/**
 * Preconnect to audio CDN for faster loading
 */
export function preconnectToHost(url: string): void {
  try {
    const { origin } = new URL(url);
    
    // Check if preconnect link already exists
    const existing = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
    if (existing) return;
    
    // Create preconnect link
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // Also add dns-prefetch as fallback
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = origin;
    document.head.appendChild(dnsLink);
    
    log.debug('Preconnected to audio host', { origin });
  } catch {
    // Invalid URL, ignore
  }
}

/**
 * Create optimized blob URL from audio source
 */
export async function createOptimizedBlobUrl(
  url: string,
  options?: StreamingLoaderOptions
): Promise<string> {
  const blob = await loadAudioProgressive(url, options);
  return URL.createObjectURL(blob);
}
