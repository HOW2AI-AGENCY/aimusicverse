/**
 * Waveform Worker Pool
 * Manages multiple workers for parallel waveform generation
 */

import { getWaveform, saveWaveform } from './waveformCache';
import { logger } from './logger';

interface PendingTask {
  resolve: (peaks: number[]) => void;
  reject: (error: Error) => void;
  audioUrl: string;
}

const WORKER_COUNT = Math.min(navigator.hardwareConcurrency || 4, 4);
const SAMPLES = 100;

class WaveformWorkerPool {
  private workers: Worker[] = [];
  private pendingTasks: Map<string, PendingTask> = new Map();
  private taskQueue: Array<{ audioUrl: string; id: string }> = [];
  private busyWorkers: Set<number> = new Set();
  private workerTaskMap: Map<number, string> = new Map(); // Track which worker is processing which task
  private initialized = false;
  
  constructor() {
    // Lazy initialization
  }
  
  private initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Create worker pool
    for (let i = 0; i < WORKER_COUNT; i++) {
      try {
        const worker = new Worker(
          new URL('../workers/waveformWorker.ts', import.meta.url),
          { type: 'module' }
        );
        
        worker.onmessage = (event) => {
          try {
            const { type, id, peaks, audioUrl, error } = event.data;
            
            const task = this.pendingTasks.get(id);
            if (!task) return;
            
            this.pendingTasks.delete(id);
            this.busyWorkers.delete(i);
            this.workerTaskMap.delete(i);
            
            if (type === 'result' && peaks) {
              // Cache the result
              saveWaveform(audioUrl, peaks).catch(() => {});
              task.resolve(peaks);
            } else if (type === 'error') {
              task.reject(new Error(error || 'Worker error'));
            } else {
              // Unexpected message type
              task.reject(new Error('Unexpected worker message type'));
            }
            
            // Process next task in queue
            this.processQueue();
          } catch (error) {
            logger.error('Error processing worker message', { workerIndex: i, error });
            // Try to clean up this worker's task
            const taskId = this.workerTaskMap.get(i);
            if (taskId) {
              const task = this.pendingTasks.get(taskId);
              if (task) {
                this.pendingTasks.delete(taskId);
                task.reject(new Error('Error processing worker response'));
              }
              this.workerTaskMap.delete(i);
            }
            this.busyWorkers.delete(i);
            this.processQueue();
          }
        };
        
        worker.onerror = (error) => {
          logger.error('Waveform worker error', { workerIndex: i, error });
          
          // Clean up the specific task that was being processed by this worker
          const taskId = this.workerTaskMap.get(i);
          if (taskId) {
            const task = this.pendingTasks.get(taskId);
            if (task) {
              this.pendingTasks.delete(taskId);
              task.reject(new Error('Worker crashed during waveform generation'));
            }
            this.workerTaskMap.delete(i);
          }
          
          this.busyWorkers.delete(i);
          this.processQueue();
        };
        
        this.workers.push(worker);
      } catch (error) {
        logger.warn('Failed to create waveform worker', { error });
      }
    }
    
    logger.info('Waveform worker pool initialized', { workerCount: this.workers.length });
  }
  
  private processQueue() {
    if (this.taskQueue.length === 0) return;
    
    // Find available worker
    for (let i = 0; i < this.workers.length; i++) {
      if (!this.busyWorkers.has(i) && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        this.busyWorkers.add(i);
        this.workerTaskMap.set(i, task.id); // Track which worker is processing this task
        
        this.workers[i].postMessage({
          type: 'generate',
          audioUrl: task.audioUrl,
          samples: SAMPLES,
          id: task.id,
        });
      }
    }
  }
  
  /**
   * Generate waveform peaks with worker pool
   * Returns cached data if available
   */
  async generate(audioUrl: string): Promise<number[]> {
    if (!audioUrl) {
      throw new Error('No audio URL provided');
    }
    
    // Check cache first
    try {
      const cached = await getWaveform(audioUrl);
      if (cached && cached.length > 0) {
        return cached;
      }
    } catch (error) {
      // Cache error, continue to generate
    }
    
    // Initialize workers if needed
    this.initialize();
    
    // Fallback if no workers available
    if (this.workers.length === 0) {
      return this.generateFallback(audioUrl);
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject, audioUrl });
      this.taskQueue.push({ audioUrl, id });
      this.processQueue();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingTasks.has(id)) {
          this.pendingTasks.delete(id);
          // Generate fallback peaks
          resolve(Array.from({ length: SAMPLES }, () => Math.random() * 0.5 + 0.2));
        }
      }, 30000);
    });
  }
  
  /**
   * Fallback generation on main thread
   */
  private async generateFallback(audioUrl: string): Promise<number[]> {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();
      
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / SAMPLES);
      const peaks: number[] = [];
      
      for (let i = 0; i < SAMPLES; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        
        let max = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }
      
      const maxPeak = Math.max(...peaks, 0.01);
      const normalized = peaks.map(p => p / maxPeak);
      
      await saveWaveform(audioUrl, normalized);
      return normalized;
    } catch (error) {
      logger.error('Fallback waveform generation failed', { error });
      return Array.from({ length: SAMPLES }, () => Math.random() * 0.5 + 0.2);
    }
  }
  
  /**
   * Prefetch multiple waveforms in parallel
   */
  async prefetchMany(audioUrls: string[]): Promise<void> {
    const uncached = await Promise.all(
      audioUrls.map(async (url) => {
        const cached = await getWaveform(url).catch(() => null);
        return cached ? null : url;
      })
    );
    
    const toPrefetch = uncached.filter(Boolean) as string[];
    
    // Generate all in parallel (worker pool handles concurrency)
    await Promise.allSettled(toPrefetch.map(url => this.generate(url)));
  }
  
  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.pendingTasks.clear();
    this.taskQueue = [];
    this.busyWorkers.clear();
    this.workerTaskMap.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const waveformWorkerPool = new WaveformWorkerPool();
