/**
 * Playback History Hook
 * 
 * Tracks listening history for:
 * - Analytics and recommendations
 * - Recently played list
 * - Skip tracking
 * - Listening time statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from './usePlayerState';
import type { Track } from '@/hooks/useTracksOptimized';

const HISTORY_STORAGE_KEY = 'musicverse-playback-history';
const MAX_HISTORY_ITEMS = 100;
const MIN_LISTEN_DURATION = 30; // seconds - minimum to count as "played"

export interface HistoryEntry {
  trackId: string;
  trackTitle: string;
  trackArtist?: string;
  trackCover?: string;
  playedAt: number;
  duration: number;
  listenedDuration: number;
  completionPercentage: number;
  skipped: boolean;
}

interface PlaybackHistoryStats {
  totalPlays: number;
  totalListenTime: number; // in seconds
  averageCompletionRate: number;
  skipRate: number;
  topTracks: Array<{ trackId: string; playCount: number }>;
}

export function usePlaybackHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentTrackStart, setCurrentTrackStart] = useState<number | null>(null);
  const [currentTrackListenTime, setCurrentTrackListenTime] = useState(0);
  
  const { activeTrack, isPlaying } = usePlayerStore();

  /**
   * Load history from localStorage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load playback history:', error);
    }
  }, []);

  /**
   * Save history to localStorage
   */
  const saveHistory = useCallback((newHistory: HistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Failed to save playback history:', error);
    }
  }, []);

  /**
   * Add entry to history
   */
  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    const newHistory = [entry, ...history];
    
    // Keep only last MAX_HISTORY_ITEMS
    if (newHistory.length > MAX_HISTORY_ITEMS) {
      newHistory.splice(MAX_HISTORY_ITEMS);
    }
    
    saveHistory(newHistory);
  }, [history, saveHistory]);

  /**
   * Record play session when track changes or stops
   */
  const recordPlaySession = useCallback((
    track: Track | null,
    listenedSeconds: number,
    skipped: boolean = false
  ) => {
    if (!track || listenedSeconds < MIN_LISTEN_DURATION) {
      return; // Don't record very short plays
    }

    const duration = track.duration_seconds || 0;
    const completionPercentage = duration > 0 
      ? Math.min(100, (listenedSeconds / duration) * 100)
      : 0;

    const entry: HistoryEntry = {
      trackId: track.id,
      trackTitle: track.title ?? 'Untitled',
      trackArtist: track.artist_name ?? undefined,
      trackCover: track.cover_url ?? undefined,
      playedAt: Date.now(),
      duration,
      listenedDuration: listenedSeconds,
      completionPercentage,
      skipped,
    };

    addHistoryEntry(entry);
  }, [addHistoryEntry]);

  /**
   * Track active track changes
   */
  useEffect(() => {
    if (activeTrack && isPlaying) {
      // New track started
      if (!currentTrackStart || activeTrack.id !== history[0]?.trackId) {
        // Record previous track if exists
        if (currentTrackStart && currentTrackListenTime > 0) {
          const previousTrack = history[0]; // Approximation
          if (previousTrack) {
            const listenedSeconds = (Date.now() - currentTrackStart) / 1000;
            recordPlaySession(activeTrack, listenedSeconds, true); // Marked as skipped
          }
        }
        
        // Start tracking new track
        setCurrentTrackStart(Date.now());
        setCurrentTrackListenTime(0);
      }
    } else if (!isPlaying && currentTrackStart) {
      // Track paused - update listen time
      const elapsed = (Date.now() - currentTrackStart) / 1000;
      setCurrentTrackListenTime(prev => prev + elapsed);
      setCurrentTrackStart(null);
    }
  }, [activeTrack?.id, isPlaying, currentTrackStart, recordPlaySession]);

  /**
   * Track when component unmounts or window closes
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeTrack && currentTrackStart) {
        const elapsed = (Date.now() - currentTrackStart) / 1000;
        const totalListened = currentTrackListenTime + elapsed;
        recordPlaySession(activeTrack, totalListened, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTrack, currentTrackStart, currentTrackListenTime, recordPlaySession]);

  /**
   * Get recently played tracks (unique)
   */
  const getRecentlyPlayed = useCallback((limit: number = 20): HistoryEntry[] => {
    const seen = new Set<string>();
    const unique: HistoryEntry[] = [];

    for (const entry of history) {
      if (!seen.has(entry.trackId)) {
        seen.add(entry.trackId);
        unique.push(entry);
        
        if (unique.length >= limit) {
          break;
        }
      }
    }

    return unique;
  }, [history]);

  /**
   * Get playback statistics
   */
  const getStats = useCallback((): PlaybackHistoryStats => {
    const totalPlays = history.length;
    const totalListenTime = history.reduce((sum, entry) => sum + entry.listenedDuration, 0);
    const averageCompletionRate = history.length > 0
      ? history.reduce((sum, entry) => sum + entry.completionPercentage, 0) / history.length
      : 0;
    const skippedCount = history.filter(entry => entry.skipped).length;
    const skipRate = history.length > 0 ? skippedCount / history.length : 0;

    // Calculate top tracks
    const trackCounts = new Map<string, number>();
    history.forEach(entry => {
      trackCounts.set(entry.trackId, (trackCounts.get(entry.trackId) || 0) + 1);
    });
    
    const topTracks = Array.from(trackCounts.entries())
      .map(([trackId, playCount]) => ({ trackId, playCount }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    return {
      totalPlays,
      totalListenTime,
      averageCompletionRate,
      skipRate,
      topTracks,
    };
  }, [history]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  /**
   * Remove specific entry
   */
  const removeEntry = useCallback((playedAt: number) => {
    const newHistory = history.filter(entry => entry.playedAt !== playedAt);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  return {
    history,
    recentlyPlayed: getRecentlyPlayed(20),
    stats: getStats(),
    getRecentlyPlayed,
    getStats,
    clearHistory,
    removeEntry,
  };
}
