/**
 * usePromptBuilder - Memoized prompt construction with caching
 * Optimizes prompt building for PromptDJ
 */

import { useMemo, useCallback, useRef } from 'react';
import type { PromptChannel, GlobalSettings } from './usePromptDJEnhanced';

// Cache for computed prompts to avoid recalculation
const promptCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(channels: PromptChannel[], settings: GlobalSettings): string {
  const channelKey = channels
    .filter(c => c.enabled && c.value && c.weight >= 0.1)
    .map(c => `${c.type}:${c.value}:${c.weight.toFixed(2)}`)
    .join('|');
  
  return `${channelKey}||${settings.bpm}:${settings.key}:${settings.scale}:${settings.density.toFixed(2)}:${settings.brightness.toFixed(2)}`;
}

export function usePromptBuilder(
  channels: PromptChannel[],
  globalSettings: GlobalSettings
) {
  const lastKeyRef = useRef<string>('');
  const lastPromptRef = useRef<string>('');

  const buildPrompt = useMemo(() => {
    const cacheKey = getCacheKey(channels, globalSettings);
    
    // Return cached if same
    if (cacheKey === lastKeyRef.current) {
      return lastPromptRef.current;
    }

    // Check global cache
    if (promptCache.has(cacheKey)) {
      const cached = promptCache.get(cacheKey)!;
      lastKeyRef.current = cacheKey;
      lastPromptRef.current = cached;
      return cached;
    }

    // Build new prompt
    const parts: string[] = [];
    
    // Group channels by type for smarter prompt construction
    const channelsByType = new Map<string, { value: string; weight: number }[]>();
    
    channels.forEach(channel => {
      if (!channel.enabled || !channel.value || channel.weight < 0.1) return;
      
      if (!channelsByType.has(channel.type)) {
        channelsByType.set(channel.type, []);
      }
      channelsByType.get(channel.type)!.push({
        value: channel.value,
        weight: channel.weight,
      });
    });

    // Build prompt from grouped channels
    channelsByType.forEach((items, type) => {
      if (items.length === 1) {
        const { value, weight } = items[0];
        const emphasis = weight > 0.7 ? 'very ' : weight > 0.4 ? '' : 'subtle ';
        parts.push(`${emphasis}${value.toLowerCase()}`);
      } else {
        // Multiple values of same type - blend them
        const blended = items
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3) // Max 3 per type
          .map(i => i.value.toLowerCase())
          .join(' and ');
        parts.push(blended);
      }
    });

    // Add global settings
    parts.push(`${globalSettings.bpm} BPM`);
    parts.push(`${globalSettings.key} ${globalSettings.scale}`);
    
    if (globalSettings.density < 0.3) parts.push('sparse, minimal');
    else if (globalSettings.density > 0.7) parts.push('dense, layered');
    
    if (globalSettings.brightness < 0.3) parts.push('warm, mellow');
    else if (globalSettings.brightness > 0.7) parts.push('bright, crisp');

    const prompt = parts.filter(Boolean).join(', ');

    // Cache it
    if (promptCache.size >= MAX_CACHE_SIZE) {
      // Clear oldest entries
      const keysToDelete = Array.from(promptCache.keys()).slice(0, 20);
      keysToDelete.forEach(k => promptCache.delete(k));
    }
    promptCache.set(cacheKey, prompt);
    
    lastKeyRef.current = cacheKey;
    lastPromptRef.current = prompt;
    
    return prompt;
  }, [channels, globalSettings]);

  // Predict likely next prompts for preloading
  const predictNextPrompts = useCallback((): string[] => {
    const predictions: string[] = [];
    
    // Vary BPM by ±5
    const bpmVariants = [
      { ...globalSettings, bpm: Math.max(60, globalSettings.bpm - 5) },
      { ...globalSettings, bpm: Math.min(180, globalSettings.bpm + 5) },
    ];
    
    bpmVariants.forEach(settings => {
      const key = getCacheKey(channels, settings);
      if (!promptCache.has(key)) {
        const parts: string[] = [];
        channels.forEach(ch => {
          if (ch.enabled && ch.value && ch.weight >= 0.1) {
            const emphasis = ch.weight > 0.7 ? 'very ' : ch.weight > 0.4 ? '' : 'subtle ';
            parts.push(`${emphasis}${ch.value.toLowerCase()}`);
          }
        });
        parts.push(`${settings.bpm} BPM`);
        parts.push(`${settings.key} ${settings.scale}`);
        predictions.push(parts.join(', '));
      }
    });

    return predictions.slice(0, 3);
  }, [channels, globalSettings]);

  return {
    prompt: buildPrompt,
    predictNextPrompts,
  };
}
