/**
 * usePredictiveGeneration - Predictive pre-generation for PromptDJ
 * Starts background generation when prompt is stable for a period
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioBufferPool } from './useAudioBufferPool';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PredictiveGen' });

interface PredictedTrack {
  prompt: string;
  audioUrl: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  priority: number;
}

interface UsePredictiveGenerationOptions {
  enabled?: boolean;
  stabilityDelay?: number; // ms before considering prompt stable
  maxPredictions?: number;
  duration?: number;
}

export function usePredictiveGeneration(
  currentPrompt: string,
  options: UsePredictiveGenerationOptions = {}
) {
  const {
    enabled = true,
    stabilityDelay = 3000, // 3 seconds of no changes
    maxPredictions = 2,
    duration = 20,
  } = options;

  const [predictions, setPredictions] = useState<Map<string, PredictedTrack>>(new Map());
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  
  const lastPromptRef = useRef<string>('');
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { queuePreload, getBuffer } = useAudioBufferPool();

  // Check if we have a pre-generated track for prompt
  const getPredictedTrack = useCallback((prompt: string): PredictedTrack | null => {
    return predictions.get(prompt) || null;
  }, [predictions]);

  // Check if prediction is ready
  const hasPrediction = useCallback((prompt: string): boolean => {
    const prediction = predictions.get(prompt);
    return prediction?.status === 'ready';
  }, [predictions]);

  // Get ready prediction URL
  const getPredictionUrl = useCallback((prompt: string): string | null => {
    const prediction = predictions.get(prompt);
    return prediction?.status === 'ready' ? prediction.audioUrl : null;
  }, [predictions]);

  // Start pre-generation for a prompt
  const preGenerate = useCallback(async (prompt: string, priority: number = 1) => {
    if (!prompt || predictions.has(prompt)) return;
    
    // Check buffer pool first
    const cachedBuffer = getBuffer(prompt);
    if (cachedBuffer?.loaded) {
      return; // Already have it cached
    }

    // Add to predictions with pending status
    setPredictions(prev => {
      const next = new Map(prev);
      next.set(prompt, {
        prompt,
        audioUrl: '',
        status: 'pending',
        priority,
      });
      return next;
    });

    // Limit concurrent predictions
    const activePredictions = Array.from(predictions.values())
      .filter(p => p.status === 'generating');
    
    if (activePredictions.length >= maxPredictions) {
      return; // Wait for slot
    }

    // Update status to generating
    setPredictions(prev => {
      const next = new Map(prev);
      const existing = next.get(prompt);
      if (existing) {
        next.set(prompt, { ...existing, status: 'generating' });
      }
      return next;
    });

    setIsPreGenerating(true);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { data, error } = await supabase.functions.invoke('musicgen-generate', {
        body: {
          prompt,
          duration,
          temperature: 1.0,
        },
      });

      if (controller.signal.aborted) return;

      if (error) throw error;

      if (data?.audio_url) {
        // Update prediction with result
        setPredictions(prev => {
          const next = new Map(prev);
          next.set(prompt, {
            prompt,
            audioUrl: data.audio_url,
            status: 'ready',
            priority,
          });
          return next;
        });

        // Queue for buffer pool preload
        queuePreload(data.audio_url, prompt);
        
        log.debug('Pre-generated track ready:', { prompt: prompt.slice(0, 50) });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      
      log.error('Pre-generation failed:', { error });
      
      // Mark as error
      setPredictions(prev => {
        const next = new Map(prev);
        const existing = next.get(prompt);
        if (existing) {
          next.set(prompt, { ...existing, status: 'error' });
        }
        return next;
      });
    } finally {
      setIsPreGenerating(false);
      abortControllerRef.current = null;
    }
  }, [predictions, maxPredictions, duration, getBuffer, queuePreload]);

  // Generate variations of current prompt
  const generateVariations = useCallback((basePrompt: string): string[] => {
    const variations: string[] = [];
    
    // Slight BPM variations
    const bpmMatch = basePrompt.match(/(\d+) BPM/);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1]);
      // Faster variation
      variations.push(basePrompt.replace(/\d+ BPM/, `${bpm + 10} BPM`));
      // Slower variation
      variations.push(basePrompt.replace(/\d+ BPM/, `${bpm - 10} BPM`));
    }
    
    return variations.slice(0, maxPredictions);
  }, [maxPredictions]);

  // Monitor prompt stability
  useEffect(() => {
    if (!enabled || !currentPrompt) return;

    // Clear previous timer
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
    }

    // Cancel ongoing prediction if prompt changed significantly
    if (lastPromptRef.current && currentPrompt !== lastPromptRef.current) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    lastPromptRef.current = currentPrompt;

    // Start stability timer
    stabilityTimerRef.current = setTimeout(() => {
      // Prompt has been stable - start pre-generation
      if (!hasPrediction(currentPrompt)) {
        log.debug('Prompt stable, starting pre-generation');
        preGenerate(currentPrompt, 1);
        
        // Also pre-generate variations
        const variations = generateVariations(currentPrompt);
        variations.forEach((variation, index) => {
          if (!hasPrediction(variation)) {
            preGenerate(variation, index + 2);
          }
        });
      }
    }, stabilityDelay);

    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, [currentPrompt, enabled, stabilityDelay, hasPrediction, preGenerate, generateVariations]);

  // Cleanup old predictions
  useEffect(() => {
    const cleanup = () => {
      setPredictions(prev => {
        const next = new Map(prev);
        // Keep only last 10 predictions
        const entries = Array.from(next.entries())
          .sort((a, b) => b[1].priority - a[1].priority)
          .slice(0, 10);
        return new Map(entries);
      });
    };

    // Cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cancel all on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, []);

  return {
    predictions,
    isPreGenerating,
    hasPrediction,
    getPredictionUrl,
    getPredictedTrack,
    preGenerate,
  };
}
