/**
 * Audio Player Hook
 * 
 * Core audio playback functionality with streaming support, buffering tracking,
 * and automatic source fallback. Creates and manages HTML5 Audio element with
 * comprehensive event handling.
 * 
 * Features:
 * - Multi-source priority (streaming → local → original URL)
 * - Automatic fallback on error
 * - Buffer progress tracking
 * - Playback time tracking
 * - Volume control
 * - Seek functionality
 * - Lifecycle management
 * 
 * @module useAudioPlayer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

const audioLogger = logger.child({ module: 'AudioPlayer' });

/**
 * Props for audio player hook
 */
interface UseAudioPlayerProps {
  trackId: string;              // Unique identifier for track
  streamingUrl?: string | null; // Primary: optimized streaming URL
  localAudioUrl?: string | null; // Secondary: cached local URL
  audioUrl?: string | null;     // Fallback: original audio URL
  onPlay?: () => void;          // Callback when playback starts
  onPause?: () => void;         // Callback when playback pauses
  onEnded?: () => void;         // Callback when track finishes
}

/**
 * Audio player hook implementation
 * 
 * @param props - Audio player configuration
 * @returns Audio player state and controls
 */
export const useAudioPlayer = ({
  trackId,
  streamingUrl,
  localAudioUrl,
  audioUrl,
  onPlay,
  onPause,
  onEnded,
}: UseAudioPlayerProps) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);    // Current play/pause state
  const [currentTime, setCurrentTime] = useState(0);    // Current playback position (seconds)
  const [duration, setDuration] = useState(0);          // Total track duration (seconds)
  const [buffered, setBuffered] = useState(0);          // Buffered percentage (0-100)
  const [loading, setLoading] = useState(false);        // Loading/buffering indicator
  
  // Audio element reference - persists across renders
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Audio source priority strategy:
   * 1. streamingUrl - Optimized for streaming (CDN, adaptive bitrate)
   * 2. localAudioUrl - Cached local file (faster, offline support)
   * 3. audioUrl - Original URL (fallback)
   */
  const audioSource = streamingUrl || localAudioUrl || audioUrl;

  /**
   * Main effect: Audio element setup and event handling
   * Runs when audioSource changes (different track or source priority change)
   */
  useEffect(() => {
    if (!audioSource) return;

    // Initialize audio element on first render
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata'; // Load only metadata initially (fast start)
    }

    const audio = audioRef.current;

    // Update audio source - triggers loading
    audio.src = audioSource;

    /**
     * Event: Loaded Metadata
     * Fired when audio metadata (duration, dimensions) is loaded
     */
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    /**
     * Event: Time Update
     * Fired as playback progresses (multiple times per second)
     * Updates current playback position
     */
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    /**
     * Event: Progress
     * Fired when browser downloads media data
     * Tracks buffering progress for better UX
     */
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        // Get the end time of the most recently buffered range
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        // Calculate percentage (0-100) for progress bar
        const bufferedPercent = (bufferedEnd / audio.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    /**
     * Event: Can Play
     * Fired when enough data is available to start playing
     */
    const handleCanPlay = () => {
      setLoading(false);
    };

    /**
     * Event: Waiting
     * Fired when playback stops due to lack of data (buffering)
     */
    const handleWaiting = () => {
      setLoading(true);
    };

    /**
     * Event: Play
     * Fired when playback starts or resumes
     */
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.(); // Notify parent component
    };

    /**
     * Event: Pause
     * Fired when playback is paused
     */
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.(); // Notify parent component
    };

    /**
     * Event: Ended
     * Fired when playback reaches the end of media
     */
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.(); // Notify parent component (triggers next track)
    };

    /**
     * Event: Error
     * Fired when media loading or playback encounters an error
     * Implements automatic fallback strategy
     */
    const handleError = (e: ErrorEvent) => {
      audioLogger.error('Audio playback error', e);
      setLoading(false);
      setIsPlaying(false);
      
      /**
       * Fallback strategy - try alternative sources
       * 1. If streaming fails → try local URL
       * 2. If local fails → try original URL
       * 3. If all fail → error state (handled by loading=false, isPlaying=false)
       */
      if (audio.src === streamingUrl && localAudioUrl) {
        audioLogger.debug('Streaming failed, attempting local source fallback');
        audio.src = localAudioUrl;
        audio.load(); // Reload with new source
      } else if (audio.src === localAudioUrl && audioUrl && audioUrl !== localAudioUrl) {
        audioLogger.debug('Local source failed, attempting original URL fallback');
        audio.src = audioUrl;
        audio.load(); // Reload with new source
      } else {
        audioLogger.error('All audio sources failed');
      }
    };

    // Register all event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);

    /**
     * Cleanup function - removes all event listeners
     * Prevents memory leaks when component unmounts or source changes
     */
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
    };
  }, [audioSource, streamingUrl, localAudioUrl, audioUrl, onPlay, onPause, onEnded]);

  /**
   * Play action - starts or resumes playback
   * 
   * Uses async/await for play() promise (required by modern browsers)
   * Handles play interruption errors gracefully
   */
  const play = useCallback(async () => {
    if (!audioRef.current || !audioSource) return;
    
    try {
      setLoading(true);
      // play() returns a Promise that resolves when playback starts
      await audioRef.current.play();
    } catch (error) {
      // Common errors: NotAllowedError (user interaction required), NotSupportedError
      audioLogger.warn('Play error', { error });
      setLoading(false);
    }
  }, [audioSource]);

  /**
   * Pause action - pauses playback
   * Synchronous operation (no promise)
   */
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  /**
   * Toggle play/pause action - convenience function
   * Commonly bound to play/pause button
   */
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  /**
   * Seek action - jumps to specific time in track
   * 
   * @param time - Target time in seconds
   * 
   * Note: Seeking may trigger buffering if target position not yet loaded
   */
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time); // Update UI immediately (before timeupdate event)
  }, []);

  /**
   * Set volume action - adjusts playback volume
   * 
   * @param volume - Volume level (0.0 to 1.0)
   * 
   * Clamps value to valid range to prevent errors
   */
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    // Clamp volume between 0 and 1
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  /**
   * Cleanup effect - runs only on component unmount
   * Ensures audio element is properly released
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Release media resources
      }
    };
  }, []);

  /**
   * Return audio player state and controls
   * 
   * State properties:
   * - isPlaying: Current playback status
   * - currentTime: Current position in seconds
   * - duration: Total track length in seconds
   * - buffered: Buffered percentage (0-100)
   * - loading: Loading/buffering indicator
   * - audioSource: Currently active audio URL
   * 
   * Control methods:
   * - play(): Start playback (async)
   * - pause(): Pause playback
   * - togglePlay(): Toggle play/pause
   * - seek(time): Jump to specific time
   * - setVolume(volume): Set volume (0-1)
   */
  return {
    isPlaying,
    currentTime,
    duration,
    buffered,
    loading,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    audioSource,
  };
};