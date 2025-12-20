/**
 * Audio Mutex - Async Lock for Audio Graph Operations
 * 
 * Prevents race conditions when modifying the Web Audio API graph.
 * Ensures sequential execution of audio-critical operations.
 */

import { logger } from './logger';

type ReleaseFunction = () => void;

interface QueueItem {
  resolve: (release: ReleaseFunction) => void;
  label?: string;
}

class AsyncMutex {
  private locked = false;
  private queue: QueueItem[] = [];
  private readonly name: string;
  private lockHolder: string | null = null;
  private lockTime: number = 0;

  constructor(name: string = 'mutex') {
    this.name = name;
  }

  /**
   * Acquire the lock. Returns a release function.
   * @param label Optional label for debugging
   * @param timeout Maximum time to wait for lock (ms)
   */
  async acquire(label?: string, timeout: number = 5000): Promise<ReleaseFunction> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from queue if still waiting
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.queue.splice(index, 1);
          logger.warn(`${this.name}: Lock acquisition timed out`, {
            label,
            currentHolder: this.lockHolder,
            heldFor: Date.now() - this.lockTime,
          });
          reject(new Error(`Lock acquisition timed out for ${label || 'unknown'}`));
        }
      }, timeout);

      const wrappedResolve = (release: ReleaseFunction) => {
        clearTimeout(timeoutId);
        resolve(release);
      };

      if (!this.locked) {
        this.locked = true;
        this.lockHolder = label || null;
        this.lockTime = Date.now();
        
        logger.debug(`${this.name}: Lock acquired`, { label });
        
        wrappedResolve(this.createRelease(label));
      } else {
        logger.debug(`${this.name}: Queuing lock request`, { 
          label, 
          queueLength: this.queue.length,
          currentHolder: this.lockHolder,
        });
        this.queue.push({ resolve: wrappedResolve, label });
      }
    });
  }

  private createRelease(label?: string): ReleaseFunction {
    let released = false;
    
    return () => {
      if (released) {
        logger.warn(`${this.name}: Double release attempted`, { label });
        return;
      }
      
      released = true;
      const heldDuration = Date.now() - this.lockTime;
      
      logger.debug(`${this.name}: Lock released`, { label, heldDuration });

      const next = this.queue.shift();
      if (next) {
        this.lockHolder = next.label || null;
        this.lockTime = Date.now();
        logger.debug(`${this.name}: Lock passed to next`, { label: next.label });
        next.resolve(this.createRelease(next.label));
      } else {
        this.locked = false;
        this.lockHolder = null;
      }
    };
  }

  /**
   * Execute a function while holding the lock
   */
  async runExclusive<T>(fn: () => T | Promise<T>, label?: string): Promise<T> {
    const release = await this.acquire(label);
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Try to acquire lock without waiting
   * Returns null if lock is not available
   */
  tryAcquire(label?: string): ReleaseFunction | null {
    if (this.locked) {
      return null;
    }
    
    this.locked = true;
    this.lockHolder = label || null;
    this.lockTime = Date.now();
    
    logger.debug(`${this.name}: Lock acquired (tryAcquire)`, { label });
    
    return this.createRelease(label);
  }

  /**
   * Check if lock is currently held
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Singleton mutex for audio graph operations
export const audioGraphMutex = new AsyncMutex('audioGraph');

// Singleton mutex for audio context operations
export const audioContextMutex = new AsyncMutex('audioContext');

/**
 * Decorator/wrapper for audio graph operations
 * Ensures sequential execution
 */
export function withAudioLock<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label?: string
): T {
  return (async (...args: Parameters<T>) => {
    return audioGraphMutex.runExclusive(() => fn(...args), label);
  }) as T;
}

/**
 * Higher-order component wrapper for React hooks
 * that need synchronized audio operations
 */
export function createLockedAudioOperation<T>(
  operation: () => Promise<T>,
  label: string
): () => Promise<T> {
  return () => audioGraphMutex.runExclusive(operation, label);
}
