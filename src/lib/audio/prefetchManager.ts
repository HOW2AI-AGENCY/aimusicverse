/**
 * Audio Prefetch Manager
 * 
 * Intelligent prefetching system with priority queue,
 * network awareness, and memory management.
 */

import { logger } from '@/lib/logger';
import { getCachedAudio, cacheAudio, shouldPrefetch as networkAllowsPrefetch } from '@/lib/audioCache';
import { preconnectToHost } from './streamingLoader';

const log = logger.child({ module: 'PrefetchManager' });

interface PrefetchTask {
  url: string;
  priority: number; // 0 = highest priority
  trackId?: string;
  retries: number;
  addedAt: number;
}

interface PrefetchManagerConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  retryLimit: number;
  retryDelayMs: number;
  idleThrottleMs: number; // Delay between prefetches when idle
}

const DEFAULT_CONFIG: PrefetchManagerConfig = {
  maxConcurrent: 2,
  maxQueueSize: 10,
  retryLimit: 2,
  retryDelayMs: 3000,
  idleThrottleMs: 500,
};

class PrefetchManager {
  private queue: PrefetchTask[] = [];
  private activeCount = 0;
  private config: PrefetchManagerConfig;
  private prefetchedUrls = new Set<string>();
  private isProcessing = false;
  private processTimeoutId: NodeJS.Timeout | null = null;

  constructor(config: Partial<PrefetchManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add URL to prefetch queue
   */
  enqueue(url: string, priority: number = 1, trackId?: string): void {
    // Skip if already prefetched or in queue
    if (this.prefetchedUrls.has(url)) {
      return;
    }
    
    const existingIndex = this.queue.findIndex(t => t.url === url);
    if (existingIndex >= 0) {
      // Update priority if higher
      if (priority < this.queue[existingIndex].priority) {
        this.queue[existingIndex].priority = priority;
        this.sortQueue();
      }
      return;
    }
    
    // Enforce queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove lowest priority item
      this.queue.pop();
    }
    
    // Preconnect to host
    preconnectToHost(url);
    
    // Add to queue
    this.queue.push({
      url,
      priority,
      trackId,
      retries: 0,
      addedAt: Date.now(),
    });
    
    this.sortQueue();
    this.scheduleProcess();
  }

  /**
   * Add multiple URLs with sequential priorities
   */
  enqueueNext(urls: string[], trackIds?: string[]): void {
    urls.forEach((url, index) => {
      this.enqueue(url, index, trackIds?.[index]);
    });
  }

  /**
   * Clear all pending prefetches
   */
  clear(): void {
    this.queue = [];
    if (this.processTimeoutId) {
      clearTimeout(this.processTimeoutId);
      this.processTimeoutId = null;
    }
  }

  /**
   * Check if URL is prefetched
   */
  isPrefetched(url: string): boolean {
    return this.prefetchedUrls.has(url);
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    activeCount: number;
    prefetchedCount: number;
  } {
    return {
      queueLength: this.queue.length,
      activeCount: this.activeCount,
      prefetchedCount: this.prefetchedUrls.size,
    };
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  private scheduleProcess(): void {
    if (this.isProcessing || this.processTimeoutId) return;
    
    // Use requestIdleCallback for non-blocking processing
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => this.process(), { timeout: 1000 });
    } else {
      this.processTimeoutId = setTimeout(() => {
        this.processTimeoutId = null;
        this.process();
      }, this.config.idleThrottleMs);
    }
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    
    // Check network conditions
    if (!networkAllowsPrefetch()) {
      log.debug('Prefetch skipped: network conditions not suitable');
      return;
    }
    
    this.isProcessing = true;
    
    while (
      this.queue.length > 0 &&
      this.activeCount < this.config.maxConcurrent
    ) {
      const task = this.queue.shift();
      if (!task) break;
      
      // Double-check not already prefetched
      if (this.prefetchedUrls.has(task.url)) {
        continue;
      }
      
      this.activeCount++;
      
      this.processSingleTask(task)
        .catch(() => {})
        .finally(() => {
          this.activeCount--;
          
          // Continue processing if more items
          if (this.queue.length > 0) {
            this.scheduleProcess();
          }
        });
    }
    
    this.isProcessing = false;
  }

  private async processSingleTask(task: PrefetchTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if already cached
      const cached = await getCachedAudio(task.url);
      if (cached) {
        this.prefetchedUrls.add(task.url);
        log.debug('Already cached', { trackId: task.trackId });
        return;
      }
      
      // Fetch audio
      const response = await fetch(task.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Cache it
      await cacheAudio(task.url, blob);
      this.prefetchedUrls.add(task.url);
      
      const duration = Date.now() - startTime;
      log.debug('Prefetch complete', { 
        trackId: task.trackId,
        size: blob.size,
        durationMs: duration 
      });
      
    } catch (error) {
      log.warn('Prefetch failed', { 
        trackId: task.trackId,
        error,
        retries: task.retries 
      });
      
      // Retry if allowed
      if (task.retries < this.config.retryLimit) {
        setTimeout(() => {
          this.queue.push({
            ...task,
            retries: task.retries + 1,
            priority: task.priority + 1, // Lower priority on retry
          });
          this.sortQueue();
          this.scheduleProcess();
        }, this.config.retryDelayMs);
      }
    }
  }
}

// Singleton instance
let prefetchManagerInstance: PrefetchManager | null = null;

export function getPrefetchManager(): PrefetchManager {
  if (!prefetchManagerInstance) {
    prefetchManagerInstance = new PrefetchManager();
  }
  return prefetchManagerInstance;
}

/**
 * Convenience function to prefetch next tracks
 */
export function prefetchNextTracks(
  tracks: Array<{ id: string; streaming_url?: string | null; local_audio_url?: string | null; audio_url?: string | null }>,
  count: number = 3
): void {
  const manager = getPrefetchManager();
  
  const urls: string[] = [];
  const trackIds: string[] = [];
  
  for (let i = 0; i < Math.min(count, tracks.length); i++) {
    const track = tracks[i];
    const url = track.streaming_url || track.local_audio_url || track.audio_url;
    if (url) {
      urls.push(url);
      trackIds.push(track.id);
    }
  }
  
  manager.enqueueNext(urls, trackIds);
}

export { PrefetchManager };
