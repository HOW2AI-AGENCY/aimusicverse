/**
 * Smart Queue Hook
 * 
 * AI-powered queue recommendations based on:
 * - Listening history
 * - Current track characteristics
 * - User preferences
 * - Similar tracks
 * - Time of day
 * 
 * Provides auto-queue refill when queue is low
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePlayerStore } from './usePlayerState';
import { usePlaybackQueue } from './usePlaybackQueue';
import { usePlaybackHistory } from './usePlaybackHistory';
import { useTracks, Track } from '@/hooks/useTracksOptimized';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'SmartQueue' });

interface SmartQueueOptions {
  enabled?: boolean;
  autoRefill?: boolean;
  minQueueSize?: number;
  maxRecommendations?: number;
}

interface TrackScore {
  track: Track;
  score: number;
  reasons: string[];
}

export function useSmartQueue(options: SmartQueueOptions = {}) {
  const {
    enabled = true,
    autoRefill = true,
    minQueueSize = 3,
    maxRecommendations = 10,
  } = options;

  const [recommendations, setRecommendations] = useState<TrackScore[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { activeTrack } = usePlayerStore();
  const { queue, queueLength, addTracks } = usePlaybackQueue();
  const { history, stats } = usePlaybackHistory();
  const { data: allTracks } = useTracks({
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  /**
   * Get user's favorite genres from history
   */
  const favoriteGenres = useMemo(() => {
    const genreCounts = new Map<string, number>();
    
    history.forEach(entry => {
      // Extract genre from track metadata (would need to be stored)
      // For now, mock this
      const genre = 'electronic'; // Placeholder
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });

    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
  }, [history]);

  /**
   * Calculate similarity score between two tracks
   */
  const calculateSimilarity = useCallback((track1: Track, track2: Track): number => {
    let score = 0;
    const reasons: string[] = [];

    // Same artist
    if (track1.artist_name === track2.artist_name) {
      score += 30;
      reasons.push('Тот же исполнитель');
    }

    // Similar style
    if (track1.style && track2.style) {
      const style1 = track1.style.toLowerCase();
      const style2 = track2.style.toLowerCase();
      
      // Check for common words
      const words1 = style1.split(/[,\s]+/);
      const words2 = style2.split(/[,\s]+/);
      const commonWords = words1.filter(w => words2.includes(w));
      
      if (commonWords.length > 0) {
        score += 20 * Math.min(commonWords.length, 3);
        reasons.push('Похожий стиль');
      }
    }

    // Similar duration (within 30 seconds)
    if (track1.duration_seconds && track2.duration_seconds) {
      const durationDiff = Math.abs(track1.duration_seconds - track2.duration_seconds);
      if (durationDiff < 30) {
        score += 10;
        reasons.push('Похожая длительность');
      }
    }

    // Similar tags
    if (track1.tags && track2.tags) {
      const tags1 = Array.isArray(track1.tags) ? track1.tags : [];
      const tags2 = Array.isArray(track2.tags) ? track2.tags : [];
      const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
      
      if (commonTags.length > 0) {
        score += 15 * Math.min(commonTags.length, 3);
        reasons.push('Общие теги');
      }
    }

    return score;
  }, []);

  /**
   * Calculate track score based on various factors
   */
  const scoreTrack = useCallback((track: Track): TrackScore => {
    let score = 0;
    const reasons: string[] = [];

    // Skip tracks already in queue
    if (queue.some(t => t.id === track.id)) {
      return { track, score: -1000, reasons: ['Уже в очереди'] };
    }

    // Skip current track
    if (activeTrack && track.id === activeTrack.id) {
      return { track, score: -1000, reasons: ['Играет сейчас'] };
    }

    // Recently played penalty (to avoid repetition)
    const recentPlay = history.find(h => h.trackId === track.id);
    if (recentPlay) {
      const hoursSincePlay = (Date.now() - recentPlay.playedAt) / (1000 * 60 * 60);
      if (hoursSincePlay < 2) {
        score -= 50;
        reasons.push('Недавно прослушано');
      } else if (hoursSincePlay < 24) {
        score -= 20;
      }
    }

    // Popularity boost (based on play count if available)
    const playCount = history.filter(h => h.trackId === track.id).length;
    if (playCount > 0) {
      score += Math.min(playCount * 5, 25);
      reasons.push('Часто слушаете');
    }

    // Similarity to current track
    if (activeTrack) {
      const similarityScore = calculateSimilarity(activeTrack, track);
      score += similarityScore;
      if (similarityScore > 30) {
        reasons.push('Похож на текущий трек');
      }
    }

    // Time of day preference (morning: upbeat, evening: calm)
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      // Morning - prefer upbeat tracks
      if (track.style?.toLowerCase().includes('upbeat') || 
          track.style?.toLowerCase().includes('energetic')) {
        score += 15;
        reasons.push('Утренний трек');
      }
    } else if (hour >= 20 || hour < 6) {
      // Night - prefer calm tracks
      if (track.style?.toLowerCase().includes('calm') || 
          track.style?.toLowerCase().includes('ambient') ||
          track.style?.toLowerCase().includes('chill')) {
        score += 15;
        reasons.push('Вечерний трек');
      }
    }

    // Recency bonus (newer tracks get slight boost)
    if (track.created_at) {
      const daysSinceCreation = (Date.now() - new Date(track.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) {
        score += 10;
        reasons.push('Новый трек');
      }
    }

    // Random factor (add variety)
    score += Math.random() * 10;

    return { track, score, reasons };
  }, [queue, activeTrack, history, calculateSimilarity]);

  /**
   * Generate smart recommendations
   */
  const generateRecommendations = useCallback(async () => {
    if (!enabled || !allTracks || allTracks.length === 0) {
      return;
    }

    setIsGenerating(true);
    log.debug('Generating smart queue recommendations');

    try {
      // Score all available tracks
      const scoredTracks = allTracks.map(scoreTrack);

      // Filter out negative scores and sort by score
      const validTracks = scoredTracks
        .filter(st => st.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations);

      setRecommendations(validTracks);
      log.debug('Generated recommendations', { count: validTracks.length });
    } catch (error) {
      log.error('Failed to generate recommendations', error);
    } finally {
      setIsGenerating(false);
    }
  }, [enabled, allTracks, scoreTrack, maxRecommendations]);

  /**
   * Auto-refill queue when it gets low
   */
  useEffect(() => {
    if (!autoRefill || !enabled) return;

    if (queueLength < minQueueSize && recommendations.length > 0 && !isGenerating) {
      const tracksToAdd = recommendations
        .slice(0, minQueueSize - queueLength)
        .map(st => st.track);

      if (tracksToAdd.length > 0) {
        log.debug('Auto-refilling queue', { count: tracksToAdd.length });
        addTracks(tracksToAdd);
        
        // Remove added tracks from recommendations
        setRecommendations(prev => 
          prev.filter(st => !tracksToAdd.some(t => t.id === st.track.id))
        );
      }
    }
  }, [queueLength, minQueueSize, recommendations, isGenerating, autoRefill, enabled, addTracks]);

  /**
   * Regenerate recommendations when active track changes
   */
  useEffect(() => {
    if (enabled && activeTrack) {
      // Debounce to avoid too frequent regeneration
      const timer = setTimeout(generateRecommendations, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTrack?.id, enabled, generateRecommendations]);

  /**
   * Add recommended tracks to queue
   */
  const addRecommendedToQueue = useCallback((count: number = 5) => {
    const tracksToAdd = recommendations
      .slice(0, count)
      .map(st => st.track);

    if (tracksToAdd.length > 0) {
      addTracks(tracksToAdd);
      
      // Remove added tracks from recommendations
      setRecommendations(prev => 
        prev.filter(st => !tracksToAdd.some(t => t.id === st.track.id))
      );
    }
  }, [recommendations, addTracks]);

  /**
   * Refresh recommendations manually
   */
  const refresh = useCallback(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  return {
    recommendations,
    isGenerating,
    addRecommendedToQueue,
    refresh,
  };
}
