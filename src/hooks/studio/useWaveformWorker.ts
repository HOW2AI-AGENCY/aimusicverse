/**
 * Waveform Worker Hook
 * 
 * Manages Web Worker for waveform peak generation.
 * Falls back to main thread if workers are not supported.
 */

import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface PendingTask {
  resolve: (peaks: number[]) => void;
  reject: (error: Error) => void;
}

interface UseWaveformWorkerReturn {
  generatePeaks: (audioData: Float32Array, targetPeaks: number) => Promise<number[]>;
  isSupported: boolean;
  terminate: () => void;
}

// Fallback for main thread processing
function generatePeaksMainThread(
  audioData: Float32Array,
  targetPeaks: number
): number[] {
  const samplesPerPeak = Math.ceil(audioData.length / targetPeaks);
  const peaks: number[] = [];
  
  for (let i = 0; i < targetPeaks; i++) {
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, audioData.length);
    
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(audioData[j]);
      if (abs > max) max = abs;
    }
    
    peaks.push(max);
  }
  
  // Normalize
  const maxPeak = Math.max(...peaks);
  return maxPeak === 0 ? peaks : peaks.map(p => p / maxPeak);
}

export function useWaveformWorker(): UseWaveformWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingTasksRef = useRef<Map<string, PendingTask>>(new Map());
  const isSupported = typeof Worker !== 'undefined';
  const idCounterRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    if (!isSupported) {
      logger.warn('Web Workers not supported, using main thread fallback');
      return;
    }

    try {
      workerRef.current = new Worker('/waveform-worker.js');
      
      workerRef.current.onmessage = (event) => {
        const { type, id } = event.data;
        const task = pendingTasksRef.current.get(id);
        
        if (!task) {
          logger.warn('Received response for unknown task', { id });
          return;
        }
        
        pendingTasksRef.current.delete(id);
        
        if (type === 'peaks-result') {
          task.resolve(event.data.peaks);
        } else if (type === 'error') {
          task.reject(new Error(event.data.error));
        }
      };
      
      workerRef.current.onerror = (error) => {
        logger.error('Waveform worker error', error);
        // Reject all pending tasks
        pendingTasksRef.current.forEach((task) => {
          task.reject(new Error('Worker error'));
        });
        pendingTasksRef.current.clear();
      };
      
      logger.info('Waveform worker initialized');
    } catch (error) {
      logger.error('Failed to initialize waveform worker', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isSupported]);

  const generatePeaks = useCallback(async (
    audioData: Float32Array,
    targetPeaks: number
  ): Promise<number[]> => {
    // Use worker if available
    if (workerRef.current) {
      return new Promise((resolve, reject) => {
        const id = `task-${++idCounterRef.current}`;
        
        pendingTasksRef.current.set(id, { resolve, reject });
        
        workerRef.current!.postMessage({
          type: 'generate-peaks',
          id,
          audioData,
          targetPeaks,
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (pendingTasksRef.current.has(id)) {
            pendingTasksRef.current.delete(id);
            reject(new Error('Worker timeout'));
          }
        }, 10000);
      });
    }
    
    // Fallback to main thread
    return generatePeaksMainThread(audioData, targetPeaks);
  }, []);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      pendingTasksRef.current.clear();
    }
  }, []);

  return {
    generatePeaks,
    isSupported,
    terminate,
  };
}
