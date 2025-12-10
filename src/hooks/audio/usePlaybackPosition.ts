/**
 * Playback Position Persistence Hook
 * 
 * Saves and restores playback position for tracks.
 * Allows users to resume where they left off.
 * 
 * Features:
 * - Auto-save position every 5 seconds when playing
 * - Restore position on track load
 * - Clean up old positions (>7 days)
 * - Skip saving for very short positions (<10s)
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from './usePlayerState';
import { getGlobalAudioRef } from './useAudioTime';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PlaybackPosition' });

const POSITION_STORAGE_KEY = 'musicverse-playback-positions';
const SAVE_INTERVAL = 5000; // Save every 5 seconds
const MIN_SAVE_POSITION = 10; // Don't save positions < 10 seconds
const MAX_AGE_DAYS = 7; // Clean up positions older than 7 days
const MAX_STORED_POSITIONS = 50; // Limit storage size

interface PlaybackPosition {
  trackId: string;
  position: number; // in seconds
  duration: number; // total duration
  timestamp: number; // when saved
}

/**
 * Load all saved positions from localStorage
 */
function loadPositions(): Map<string, PlaybackPosition> {
  try {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!stored) return new Map();

    const positions = JSON.parse(stored) as PlaybackPosition[];
    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // Filter out old positions and convert to Map
    const validPositions = positions.filter(
      pos => now - pos.timestamp < maxAge
    );

    return new Map(validPositions.map(pos => [pos.trackId, pos]));
  } catch (error) {
    log.error('Failed to load playback positions', error);
    return new Map();
  }
}

/**
 * Save positions to localStorage
 */
function savePositions(positions: Map<string, PlaybackPosition>): void {
  try {
    // Convert Map to array and limit size
    const positionsArray = Array.from(positions.values())
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, MAX_STORED_POSITIONS);

    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positionsArray));
  } catch (error) {
    log.error('Failed to save playback positions', error);
  }
}

/**
 * Hook for playback position persistence
 */
export function usePlaybackPosition() {
  const { activeTrack, isPlaying } = usePlayerStore();
  const positionsRef = useRef<Map<string, PlaybackPosition>>(loadPositions());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef<Set<string>>(new Set());

  /**
   * Save current position
   */
  const saveCurrentPosition = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio || !activeTrack) return;

    const position = audio.currentTime;
    const duration = audio.duration;

    // Don't save if position is too early or track is finished
    if (position < MIN_SAVE_POSITION || position >= duration - 5) {
      return;
    }

    const positionData: PlaybackPosition = {
      trackId: activeTrack.id,
      position,
      duration,
      timestamp: Date.now(),
    };

    positionsRef.current.set(activeTrack.id, positionData);
    savePositions(positionsRef.current);

    log.debug('Saved playback position', {
      trackId: activeTrack.id,
      position: Math.floor(position),
      duration: Math.floor(duration),
    });
  }, [activeTrack]);

  /**
   * Get saved position for a track
   */
  const getSavedPosition = useCallback((trackId: string): number | null => {
    const position = positionsRef.current.get(trackId);
    if (!position) return null;

    // Only restore if position is meaningful (>10s and <90% of duration)
    if (position.position < MIN_SAVE_POSITION) return null;
    if (position.position >= position.duration * 0.9) return null;

    return position.position;
  }, []);

  /**
   * Restore position for current track
   */
  const restorePosition = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio || !activeTrack) return;

    // Don't restore if already restored for this track in this session
    if (hasRestoredRef.current.has(activeTrack.id)) return;

    const savedPosition = getSavedPosition(activeTrack.id);
    if (savedPosition !== null && audio.readyState >= 2) {
      audio.currentTime = savedPosition;
      hasRestoredRef.current.add(activeTrack.id);
      
      log.info('Restored playback position', {
        trackId: activeTrack.id,
        position: Math.floor(savedPosition),
      });
    }
  }, [activeTrack, getSavedPosition]);

  /**
   * Clear saved position for a track
   */
  const clearPosition = useCallback((trackId: string) => {
    positionsRef.current.delete(trackId);
    savePositions(positionsRef.current);
  }, []);

  /**
   * Clear all saved positions
   */
  const clearAllPositions = useCallback(() => {
    positionsRef.current.clear();
    savePositions(positionsRef.current);
  }, []);

  /**
   * Auto-save effect - save position periodically when playing
   */
  useEffect(() => {
    if (isPlaying && activeTrack) {
      // Save immediately on track change
      saveCurrentPosition();

      // Then save periodically
      saveTimerRef.current = setInterval(saveCurrentPosition, SAVE_INTERVAL);

      return () => {
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        // Save one last time when stopping
        saveCurrentPosition();
      };
    } else {
      // Clear interval if paused
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    }
  }, [isPlaying, activeTrack?.id, saveCurrentPosition]);

  /**
   * Restore position when track loads
   */
  useEffect(() => {
    if (activeTrack) {
      const audio = getGlobalAudioRef();
      if (!audio) return;

      // Wait for metadata to be loaded
      const handleLoadedMetadata = () => {
        restorePosition();
      };

      if (audio.readyState >= 2) {
        // Already loaded
        restorePosition();
      } else {
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }
  }, [activeTrack?.id, restorePosition]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
      saveCurrentPosition();
    };
  }, [saveCurrentPosition]);

  return {
    getSavedPosition,
    clearPosition,
    clearAllPositions,
  };
}
