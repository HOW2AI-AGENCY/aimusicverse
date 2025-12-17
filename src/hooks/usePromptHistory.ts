/**
 * usePromptHistory - Smart prompt history with analytics
 * Tracks successful generations and provides recommendations
 */

import { useMemo, useCallback } from 'react';
import { usePromptDJStore, selectHistory, selectTopRatedPrompts } from './usePromptDJStore';
import { PromptChannel, GlobalSettings } from './usePromptDJEnhanced';

interface PromptAnalytics {
  topGenres: Array<{ value: string; count: number }>;
  topMoods: Array<{ value: string; count: number }>;
  avgBPM: number;
  avgDensity: number;
  avgBrightness: number;
  preferredDuration: number;
  successRate: number;
}

interface SimilarPrompt {
  prompt: string;
  similarity: number;
  audioUrl?: string;
  rating?: number;
}

export function usePromptHistory() {
  const history = usePromptDJStore(selectHistory);
  const topRated = usePromptDJStore(selectTopRatedPrompts);
  const { addToHistory, rateHistoryEntry, clearHistory } = usePromptDJStore();

  // Analyze user's generation patterns
  const analytics = useMemo((): PromptAnalytics => {
    if (history.length === 0) {
      return {
        topGenres: [],
        topMoods: [],
        avgBPM: 120,
        avgDensity: 0.5,
        avgBrightness: 0.5,
        preferredDuration: 20,
        successRate: 0,
      };
    }

    // Count channel values by type
    const genreCounts = new Map<string, number>();
    const moodCounts = new Map<string, number>();
    let totalBPM = 0;
    let totalDensity = 0;
    let totalBrightness = 0;
    let durationCounts = new Map<number, number>();
    let ratedCount = 0;
    let highRatedCount = 0;

    history.forEach(entry => {
      // Analyze channels
      entry.channels.forEach(channel => {
        if (channel.enabled && channel.value) {
          if (channel.type === 'genre') {
            genreCounts.set(channel.value, (genreCounts.get(channel.value) || 0) + 1);
          } else if (channel.type === 'mood') {
            moodCounts.set(channel.value, (moodCounts.get(channel.value) || 0) + 1);
          }
        }
      });

      // Analyze settings
      totalBPM += entry.settings.bpm;
      totalDensity += entry.settings.density;
      totalBrightness += entry.settings.brightness;
      durationCounts.set(
        entry.settings.duration,
        (durationCounts.get(entry.settings.duration) || 0) + 1
      );

      // Track ratings
      if (entry.rating !== undefined) {
        ratedCount++;
        if (entry.rating >= 4) highRatedCount++;
      }
    });

    // Sort and get top items
    const sortByCount = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

    // Find most common duration
    let maxDurationCount = 0;
    let preferredDuration = 20;
    durationCounts.forEach((count, duration) => {
      if (count > maxDurationCount) {
        maxDurationCount = count;
        preferredDuration = duration;
      }
    });

    return {
      topGenres: sortByCount(genreCounts),
      topMoods: sortByCount(moodCounts),
      avgBPM: Math.round(totalBPM / history.length),
      avgDensity: totalDensity / history.length,
      avgBrightness: totalBrightness / history.length,
      preferredDuration,
      successRate: ratedCount > 0 ? highRatedCount / ratedCount : 0,
    };
  }, [history]);

  // Find prompts similar to current
  const findSimilarPrompts = useCallback((
    currentPrompt: string,
    maxResults: number = 5
  ): SimilarPrompt[] => {
    if (!currentPrompt || history.length === 0) return [];

    const currentWords = new Set(
      currentPrompt.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2)
    );

    return history
      .map(entry => {
        const historyWords = new Set(
          entry.prompt.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2)
        );
        
        // Calculate Jaccard similarity
        const intersection = new Set(
          [...currentWords].filter(w => historyWords.has(w))
        );
        const union = new Set([...currentWords, ...historyWords]);
        const similarity = intersection.size / union.size;

        return {
          prompt: entry.prompt,
          similarity,
          audioUrl: entry.audioUrl,
          rating: entry.rating,
        };
      })
      .filter(item => item.similarity > 0.2 && item.similarity < 1) // Not identical
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }, [history]);

  // Get recommendations based on history
  const getRecommendations = useCallback((
    currentChannels: PromptChannel[],
    count: number = 3
  ): Array<{ type: string; value: string; reason: string }> => {
    const recommendations: Array<{ type: string; value: string; reason: string }> = [];

    // Get currently active values
    const activeGenres = new Set(
      currentChannels.filter(c => c.type === 'genre' && c.enabled).map(c => c.value)
    );
    const activeMoods = new Set(
      currentChannels.filter(c => c.type === 'mood' && c.enabled).map(c => c.value)
    );

    // Recommend popular genres not currently used
    analytics.topGenres.forEach(({ value }) => {
      if (!activeGenres.has(value) && recommendations.length < count) {
        recommendations.push({
          type: 'genre',
          value,
          reason: 'Часто используется в ваших миксах',
        });
      }
    });

    // Recommend popular moods
    analytics.topMoods.forEach(({ value }) => {
      if (!activeMoods.has(value) && recommendations.length < count) {
        recommendations.push({
          type: 'mood',
          value,
          reason: 'Хорошо сочетается с вашим стилем',
        });
      }
    });

    // Recommend from top-rated prompts
    topRated.slice(0, 2).forEach(entry => {
      const unusedChannel = entry.channels.find(
        c => c.enabled && c.value && 
        !currentChannels.some(cc => cc.type === c.type && cc.value === c.value && cc.enabled)
      );
      if (unusedChannel && recommendations.length < count) {
        recommendations.push({
          type: unusedChannel.type,
          value: unusedChannel.value,
          reason: 'Из вашего топ-микса',
        });
      }
    });

    return recommendations.slice(0, count);
  }, [analytics, topRated]);

  // Save generation to history
  const saveGeneration = useCallback((
    prompt: string,
    channels: PromptChannel[],
    settings: GlobalSettings,
    audioUrl?: string
  ) => {
    addToHistory({
      prompt,
      channels: [...channels], // Clone to prevent mutations
      settings: { ...settings },
      audioUrl,
    });
  }, [addToHistory]);

  return {
    history,
    topRated,
    analytics,
    findSimilarPrompts,
    getRecommendations,
    saveGeneration,
    rateHistoryEntry,
    clearHistory,
  };
}
