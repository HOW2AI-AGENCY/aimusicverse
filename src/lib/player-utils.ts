/**
 * Player Utility Functions
 *
 * Provides utilities for audio player functionality:
 * - Time formatting
 * - Progress calculation
 * - Queue navigation logic
 * - Playback state management
 */

import type { Track } from "@/hooks/useTracksOptimized";
import { formatTime as formatTimeFromFormatters, formatTimeWithMs } from '@/lib/formatters';

// Re-export from shared formatters for backwards compatibility
export const formatTime = formatTimeFromFormatters;
export const formatTimePrecise = formatTimeWithMs;

/**
 * Format duration in seconds to MM:SS format (alias for formatTime)
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = formatTimeFromFormatters;

/**
 * Calculate playback progress percentage
 * @param currentTime - Current playback time in seconds
 * @param duration - Total duration in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(currentTime: number, duration: number): number {
  if (!duration || duration <= 0 || !isFinite(duration)) {
    return 0;
  }

  const progress = (currentTime / duration) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}

/**
 * Get the next track in the queue
 * @param queue - Array of tracks
 * @param currentIndex - Current track index
 * @param repeat - Repeat mode ('off' | 'all' | 'one')
 * @param shuffle - Whether shuffle is enabled
 * @returns Next track index, or null if no next track
 */
export function getNextTrack(
  queue: Track[],
  currentIndex: number,
  repeat: "off" | "all" | "one" = "off",
  shuffle: boolean = false,
): number | null {
  if (!queue || queue.length === 0) {
    return null;
  }

  // If repeat one, stay on current track
  if (repeat === "one") {
    return currentIndex;
  }

  // If shuffle, get random track (but not the current one if possible)
  if (shuffle) {
    if (queue.length === 1) {
      return repeat === "all" ? 0 : null;
    }

    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * queue.length);
    } while (nextIndex === currentIndex && queue.length > 1);

    return nextIndex;
  }

  // Normal sequential playback
  const nextIndex = currentIndex + 1;

  if (nextIndex >= queue.length) {
    // End of queue
    return repeat === "all" ? 0 : null;
  }

  return nextIndex;
}

/**
 * Get the previous track in the queue
 * @param queue - Array of tracks
 * @param currentIndex - Current track index
 * @param currentTime - Current playback time (if > 3s, restart current track)
 * @returns Previous track index
 */
export function getPreviousTrack(queue: Track[], currentIndex: number, currentTime: number = 0): number {
  if (!queue || queue.length === 0) {
    return 0;
  }

  // If more than 3 seconds into the track, restart current track
  if (currentTime > 3) {
    return currentIndex;
  }

  const prevIndex = currentIndex - 1;

  // If at the beginning, wrap to the end
  if (prevIndex < 0) {
    return queue.length - 1;
  }

  return prevIndex;
}

/**
 * Shuffle an array of tracks using Fisher-Yates algorithm
 * Preserves the current track at the beginning
 * Uses smart distribution to avoid recent repeats
 * @param queue - Array of tracks
 * @param currentIndex - Index of current track to preserve
 * @param playHistory - Optional array of recently played track IDs to avoid
 * @returns Shuffled queue with current track at index 0
 */
export function shuffleQueue(
  queue: Track[], 
  currentIndex: number = 0,
  playHistory: string[] = []
): Track[] {
  if (!queue || queue.length <= 1) {
    return queue;
  }

  const shuffled = [...queue];
  const currentTrack = shuffled[currentIndex];

  // Remove current track
  shuffled.splice(currentIndex, 1);

  // Separate tracks into recently played and others for smarter shuffle
  const recentlyPlayed = new Set(playHistory.slice(-5)); // Last 5 tracks
  const notRecentTracks: Track[] = [];
  const recentTracks: Track[] = [];
  
  shuffled.forEach(track => {
    if (recentlyPlayed.has(track.id)) {
      recentTracks.push(track);
    } else {
      notRecentTracks.push(track);
    }
  });

  // Fisher-Yates shuffle both groups
  const fisherYatesShuffle = (arr: Track[]) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const shuffledNotRecent = fisherYatesShuffle(notRecentTracks);
  const shuffledRecent = fisherYatesShuffle(recentTracks);

  // Combine: not-recent tracks first, then recent tracks
  // This pushes recently played tracks further down the queue
  const finalShuffled = [...shuffledNotRecent, ...shuffledRecent];

  // Put current track at the beginning
  finalShuffled.unshift(currentTrack);

  return finalShuffled;
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 * @param timeString - Time string to parse
 * @returns Time in seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(":").map(Number);

  if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Check if audio can be played (valid URL and format)
 * @param audioUrl - Audio URL to check
 * @returns True if audio URL is valid
 */
export function canPlayAudio(audioUrl: string | null | undefined): boolean {
  if (!audioUrl) return false;

  const validExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];
  const urlLower = audioUrl.toLowerCase();

  return (
    validExtensions.some((ext) => urlLower.includes(ext)) ||
    urlLower.startsWith("blob:") ||
    urlLower.startsWith("data:audio/")
  );
}

/**
 * Get buffered percentage of audio
 * @param buffered - TimeRanges object from audio element
 * @param duration - Total duration in seconds
 * @returns Buffered percentage (0-100)
 */
export function getBufferedPercentage(buffered: TimeRanges | null, duration: number): number {
  if (!buffered || buffered.length === 0 || !duration) {
    return 0;
  }

  // Get the end time of the last buffered range
  const bufferedEnd = buffered.end(buffered.length - 1);
  return (bufferedEnd / duration) * 100;
}
