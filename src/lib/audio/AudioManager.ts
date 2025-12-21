/**
 * AudioManager - Centralized Audio Element Pooling
 * 
 * Manages audio element lifecycle with pooling to prevent memory leaks
 * and respect mobile browser limits (6-8 concurrent audio elements).
 * 
 * Phase 1 Critical Fix: IMP-AudioContext-001
 * Priority: P0 CRITICAL
 * 
 * Features:
 * - Audio element pooling (max 8 elements)
 * - Automatic cleanup of oldest elements
 * - AudioContext state management
 * - Memory leak prevention
 * - Mobile browser compatibility
 */

import { createAudioContext, ensureAudioContextRunning } from './audioContextHelper';
import { logger } from '@/lib/logger';

interface AudioElementMetadata {
  id: string;
  element: HTMLAudioElement;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}

interface AudioManagerConfig {
  maxPoolSize: number;
  enableLogging: boolean;
  autoCleanupInterval: number; // ms
}

const DEFAULT_CONFIG: AudioManagerConfig = {
  maxPoolSize: 8, // Mobile browser safe limit
  enableLogging: true,
  autoCleanupInterval: 60000, // 1 minute
};

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private audioPool: Map<string, AudioElementMetadata> = new Map();
  private config: AudioManagerConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private constructor(config: Partial<AudioManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAudioContext();
    this.setupAudioContextStateManagement();
    this.startAutoCleanup();

    if (this.config.enableLogging) {
      logger.info('AudioManager initialized', {
        maxPoolSize: this.config.maxPoolSize,
        autoCleanupInterval: this.config.autoCleanupInterval,
      });
    }
  }

  static getInstance(config?: Partial<AudioManagerConfig>): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager(config);
    }
    return AudioManager.instance;
  }

  /**
   * Initialize AudioContext with error handling
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = createAudioContext();
      if (this.config.enableLogging) {
        logger.debug('AudioContext created', {
          state: this.audioContext.state,
          sampleRate: this.audioContext.sampleRate,
        });
      }
    } catch (error) {
      logger.error('Failed to create AudioContext', { error });
    }
  }

  /**
   * Setup AudioContext state management
   * Handles visibility changes and suspends/resumes context
   */
  private setupAudioContextStateManagement(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (!this.audioContext) return;

      try {
        if (document.hidden && this.audioContext.state === 'running') {
          await this.audioContext.suspend();
          if (this.config.enableLogging) {
            logger.debug('AudioContext suspended (page hidden)');
          }
        } else if (!document.hidden && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
          if (this.config.enableLogging) {
            logger.debug('AudioContext resumed (page visible)');
          }
        }
      } catch (error) {
        logger.error('Error managing AudioContext state', { error });
      }
    });

    // Resume AudioContext on user interaction (required on iOS)
    const resumeAudioContext = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await ensureAudioContextRunning(this.audioContext);
          if (this.config.enableLogging) {
            logger.debug('AudioContext resumed on user interaction');
          }
        } catch (error) {
          logger.error('Error resuming AudioContext', { error });
        }
      }
    };

    // Listen for first user interaction
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resumeAudioContext, { once: true, passive: true });
    });
  }

  /**
   * Get or create an audio element from the pool
   * Automatically manages pool size and evicts oldest elements
   */
  async getAudioElement(id: string): Promise<HTMLAudioElement> {
    // Return existing element if available
    const existing = this.audioPool.get(id);
    if (existing) {
      existing.lastUsed = Date.now();
      existing.isActive = true;
      if (this.config.enableLogging) {
        logger.debug('Audio element retrieved from pool', { id, poolSize: this.audioPool.size });
      }
      return existing.element;
    }

    // Evict oldest inactive element if pool is full
    if (this.audioPool.size >= this.config.maxPoolSize) {
      this.evictOldestInactive();
    }

    // Create new audio element
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    const metadata: AudioElementMetadata = {
      id,
      element: audio,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
    };

    this.audioPool.set(id, metadata);

    if (this.config.enableLogging) {
      logger.debug('Audio element created', {
        id,
        poolSize: this.audioPool.size,
        maxPoolSize: this.config.maxPoolSize,
      });
    }

    return audio;
  }

  /**
   * Release an audio element back to the pool
   * Marks as inactive but keeps in pool for reuse
   */
  releaseAudioElement(id: string): void {
    const metadata = this.audioPool.get(id);
    if (metadata) {
      metadata.isActive = false;
      metadata.element.pause();
      
      if (this.config.enableLogging) {
        logger.debug('Audio element released', { id, poolSize: this.audioPool.size });
      }
    }
  }

  /**
   * Remove an audio element from the pool completely
   * Cleans up resources and removes from pool
   */
  removeAudioElement(id: string): void {
    const metadata = this.audioPool.get(id);
    if (metadata) {
      const { element } = metadata;
      element.pause();
      element.src = '';
      element.load(); // Force release of resources
      this.audioPool.delete(id);

      if (this.config.enableLogging) {
        logger.debug('Audio element removed', { id, poolSize: this.audioPool.size });
      }
    }
  }

  /**
   * Evict oldest inactive audio element
   */
  private evictOldestInactive(): void {
    let oldestMetadata: AudioElementMetadata | null = null;
    let oldestTime = Infinity;

    // Find oldest inactive element
    for (const metadata of this.audioPool.values()) {
      if (!metadata.isActive && metadata.lastUsed < oldestTime) {
        oldestTime = metadata.lastUsed;
        oldestMetadata = metadata;
      }
    }

    // If no inactive elements, evict oldest overall
    if (!oldestMetadata) {
      for (const metadata of this.audioPool.values()) {
        if (metadata.lastUsed < oldestTime) {
          oldestTime = metadata.lastUsed;
          oldestMetadata = metadata;
        }
      }
    }

    if (oldestMetadata) {
      if (this.config.enableLogging) {
        logger.info('Evicting audio element', {
          id: oldestMetadata.id,
          age: Date.now() - oldestMetadata.createdAt,
          isActive: oldestMetadata.isActive,
        });
      }
      this.removeAudioElement(oldestMetadata.id);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveElements();
    }, this.config.autoCleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup inactive elements that haven't been used recently
   * Keeps pool size manageable and prevents memory leaks
   */
  private cleanupInactiveElements(): void {
    const now = Date.now();
    const maxInactiveTime = 5 * 60 * 1000; // 5 minutes
    const elementsToRemove: string[] = [];

    for (const [id, metadata] of this.audioPool) {
      if (!metadata.isActive && now - metadata.lastUsed > maxInactiveTime) {
        elementsToRemove.push(id);
      }
    }

    if (elementsToRemove.length > 0 && this.config.enableLogging) {
      logger.info('Cleaning up inactive audio elements', {
        count: elementsToRemove.length,
        poolSize: this.audioPool.size,
      });
    }

    elementsToRemove.forEach(id => this.removeAudioElement(id));
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalElements: number;
    activeElements: number;
    inactiveElements: number;
    maxPoolSize: number;
  } {
    let activeCount = 0;
    let inactiveCount = 0;

    for (const metadata of this.audioPool.values()) {
      if (metadata.isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    return {
      totalElements: this.audioPool.size,
      activeElements: activeCount,
      inactiveElements: inactiveCount,
      maxPoolSize: this.config.maxPoolSize,
    };
  }

  /**
   * Get AudioContext instance
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Cleanup all audio elements and close AudioContext
   * Should be called on app unmount
   */
  cleanup(): void {
    if (this.config.enableLogging) {
      logger.info('AudioManager cleanup started', {
        poolSize: this.audioPool.size,
      });
    }

    // Stop cleanup timer
    this.stopAutoCleanup();

    // Cleanup all audio elements
    this.audioPool.forEach((metadata) => {
      metadata.element.pause();
      metadata.element.src = '';
      metadata.element.load();
    });
    this.audioPool.clear();

    // Close AudioContext
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(error => {
        logger.error('Error closing AudioContext', { error });
      });
    }

    if (this.config.enableLogging) {
      logger.info('AudioManager cleanup complete');
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Export class for testing
export { AudioManager };
export type { AudioManagerConfig, AudioElementMetadata };
