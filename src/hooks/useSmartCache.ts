/**
 * useSmartCache - Intelligent caching with fuzzy prompt matching
 * Finds similar cached results to reduce generation time
 */

import { useCallback, useRef, useMemo } from 'react';

interface CacheEntry {
  prompt: string;
  audioUrl: string;
  bpm: number;
  duration: number;
  createdAt: number;
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const tokens1 = str1.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const tokens2 = str2.toLowerCase().split(/[,\s]+/).filter(Boolean);
  
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  // Jaccard similarity
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...tokens1, ...tokens2]).size;
  
  return union > 0 ? intersection / union : 0;
}

// Extract key musical elements from prompt
function extractMusicElements(prompt: string): Record<string, string> {
  const elements: Record<string, string> = {};
  const lower = prompt.toLowerCase();
  
  // Extract BPM
  const bpmMatch = lower.match(/(\d+)\s*bpm/);
  if (bpmMatch) elements.bpm = bpmMatch[1];
  
  // Extract key/scale
  const keyMatch = lower.match(/\b([a-g]#?)\s*(major|minor|dorian|pentatonic)\b/i);
  if (keyMatch) {
    elements.key = keyMatch[1].toUpperCase();
    elements.scale = keyMatch[2].toLowerCase();
  }
  
  // Common genre keywords
  const genres = ['electronic', 'hip-hop', 'rock', 'jazz', 'pop', 'ambient', 'lo-fi', 'edm', 'classical', 'trap', 'house', 'techno'];
  for (const genre of genres) {
    if (lower.includes(genre)) {
      elements.genre = genre;
      break;
    }
  }
  
  // Common mood keywords
  const moods = ['energetic', 'calm', 'dark', 'happy', 'epic', 'dreamy', 'aggressive', 'romantic', 'mysterious'];
  for (const mood of moods) {
    if (lower.includes(mood)) {
      elements.mood = mood;
      break;
    }
  }
  
  return elements;
}

// Check if two prompts are musically compatible (same key/tempo)
function areMusicallyCompatible(prompt1: string, prompt2: string): boolean {
  const elements1 = extractMusicElements(prompt1);
  const elements2 = extractMusicElements(prompt2);
  
  // BPM must be within ±10
  if (elements1.bpm && elements2.bpm) {
    const bpmDiff = Math.abs(parseInt(elements1.bpm) - parseInt(elements2.bpm));
    if (bpmDiff > 10) return false;
  }
  
  // Key must match if both specified
  if (elements1.key && elements2.key && elements1.key !== elements2.key) {
    return false;
  }
  
  return true;
}

const MAX_CACHE_SIZE = 50;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useSmartCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  
  // Add to cache
  const addToCache = useCallback((prompt: string, audioUrl: string, bpm: number, duration: number) => {
    const cache = cacheRef.current;
    
    // Evict old entries if over limit
    if (cache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      const toRemove = entries.slice(0, 10); // Remove oldest 10
      toRemove.forEach(([key]) => cache.delete(key));
    }
    
    cache.set(prompt, {
      prompt,
      audioUrl,
      bpm,
      duration,
      createdAt: Date.now(),
    });
  }, []);
  
  // Find exact match
  const getExactMatch = useCallback((prompt: string): CacheEntry | null => {
    const entry = cacheRef.current.get(prompt);
    if (entry && Date.now() - entry.createdAt < CACHE_TTL) {
      return entry;
    }
    return null;
  }, []);
  
  // Find similar prompts with score >= threshold
  const findSimilar = useCallback((prompt: string, threshold = 0.7): Array<CacheEntry & { similarity: number }> => {
    const results: Array<CacheEntry & { similarity: number }> = [];
    const now = Date.now();
    
    cacheRef.current.forEach((entry) => {
      // Skip expired entries
      if (now - entry.createdAt > CACHE_TTL) return;
      
      // Check musical compatibility first (fast check)
      if (!areMusicallyCompatible(prompt, entry.prompt)) return;
      
      // Calculate text similarity
      const similarity = calculateSimilarity(prompt, entry.prompt);
      
      if (similarity >= threshold) {
        results.push({ ...entry, similarity });
      }
    });
    
    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results;
  }, []);
  
  // Get best match (exact or similar)
  const getBestMatch = useCallback((prompt: string): { entry: CacheEntry; isExact: boolean } | null => {
    // Try exact match first
    const exact = getExactMatch(prompt);
    if (exact) return { entry: exact, isExact: true };
    
    // Try similar match
    const similar = findSimilar(prompt, 0.75);
    if (similar.length > 0) {
      return { entry: similar[0], isExact: false };
    }
    
    return null;
  }, [getExactMatch, findSimilar]);
  
  // Check if similar exists (for UI hints)
  const hasSimilarCached = useCallback((prompt: string): boolean => {
    if (!prompt) return false;
    return getBestMatch(prompt) !== null;
  }, [getBestMatch]);
  
  // Get cache stats
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    
    cache.forEach(entry => {
      if (now - entry.createdAt < CACHE_TTL) {
        validCount++;
      } else {
        expiredCount++;
      }
    });
    
    return {
      total: cache.size,
      valid: validCount,
      expired: expiredCount,
    };
  }, []);
  
  // Clear expired entries
  const clearExpired = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    cache.forEach((entry, key) => {
      if (now - entry.createdAt > CACHE_TTL) {
        cache.delete(key);
      }
    });
  }, []);
  
  return {
    addToCache,
    getExactMatch,
    findSimilar,
    getBestMatch,
    hasSimilarCached,
    getCacheStats,
    clearExpired,
  };
}
