/**
 * Audio Buffer Pool
 * 
 * Manages reusable audio buffers for improved memory efficiency.
 * Implements LRU (Least Recently Used) eviction strategy.
 * 
 * Phase 2 Tech Debt: IMP033 - Buffer Pooling
 */

interface PooledBuffer {
  buffer: AudioBuffer;
  key: string;
  lastUsed: number;
  size: number;
}

interface BufferPoolConfig {
  maxPoolSize: number; // Maximum total bytes
  maxBuffers: number;  // Maximum number of buffers
  ttlMs: number;       // Time to live in milliseconds
}

const DEFAULT_CONFIG: BufferPoolConfig = {
  maxPoolSize: 50 * 1024 * 1024, // 50MB
  maxBuffers: 20,
  ttlMs: 5 * 60 * 1000, // 5 minutes
};

class AudioBufferPool {
  private buffers: Map<string, PooledBuffer> = new Map();
  private currentSize = 0;
  private config: BufferPoolConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<BufferPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Get a buffer from the pool
   */
  get(key: string): AudioBuffer | null {
    const pooled = this.buffers.get(key);
    if (pooled) {
      pooled.lastUsed = Date.now();
      return pooled.buffer;
    }
    return null;
  }

  /**
   * Add a buffer to the pool
   */
  set(key: string, buffer: AudioBuffer): void {
    // Calculate buffer size
    const bufferSize = buffer.length * buffer.numberOfChannels * 4; // 4 bytes per float32

    // Remove existing buffer if present
    if (this.buffers.has(key)) {
      this.remove(key);
    }

    // Evict if necessary
    while (
      (this.currentSize + bufferSize > this.config.maxPoolSize ||
       this.buffers.size >= this.config.maxBuffers) &&
      this.buffers.size > 0
    ) {
      this.evictLRU();
    }

    // Add new buffer
    this.buffers.set(key, {
      buffer,
      key,
      lastUsed: Date.now(),
      size: bufferSize,
    });
    this.currentSize += bufferSize;
  }

  /**
   * Remove a buffer from the pool
   */
  remove(key: string): boolean {
    const pooled = this.buffers.get(key);
    if (pooled) {
      this.currentSize -= pooled.size;
      this.buffers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Check if a buffer exists in the pool
   */
  has(key: string): boolean {
    return this.buffers.has(key);
  }

  /**
   * Get pool statistics
   */
  getStats(): { bufferCount: number; totalSize: number; maxSize: number } {
    return {
      bufferCount: this.buffers.size,
      totalSize: this.currentSize,
      maxSize: this.config.maxPoolSize,
    };
  }

  /**
   * Clear all buffers from the pool
   */
  clear(): void {
    this.buffers.clear();
    this.currentSize = 0;
  }

  /**
   * Dispose the pool and clean up
   */
  dispose(): void {
    this.stopCleanupTimer();
    this.clear();
  }

  /**
   * Evict least recently used buffer
   */
  private evictLRU(): void {
    let oldest: PooledBuffer | null = null;
    let oldestTime = Infinity;

    for (const pooled of this.buffers.values()) {
      if (pooled.lastUsed < oldestTime) {
        oldestTime = pooled.lastUsed;
        oldest = pooled;
      }
    }

    if (oldest) {
      this.remove(oldest.key);
    }
  }

  /**
   * Clean up expired buffers
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, pooled] of this.buffers) {
      if (now - pooled.lastUsed > this.config.ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.remove(key);
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
let bufferPoolInstance: AudioBufferPool | null = null;

/**
 * Get the global buffer pool instance
 */
export function getBufferPool(config?: Partial<BufferPoolConfig>): AudioBufferPool {
  if (!bufferPoolInstance) {
    bufferPoolInstance = new AudioBufferPool(config);
  }
  return bufferPoolInstance;
}

/**
 * Create a new buffer pool with custom configuration
 */
export function createBufferPool(config: Partial<BufferPoolConfig> = {}): AudioBufferPool {
  return new AudioBufferPool(config);
}

export type { AudioBufferPool, BufferPoolConfig, PooledBuffer };
