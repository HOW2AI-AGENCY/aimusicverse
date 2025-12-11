/**
 * Player State Management
 * 
 * Central state store for the music player using Zustand.
 * Manages playback state, queue, shuffle/repeat modes, and player UI modes.
 * 
 * @module usePlayerState
 */

import { create } from 'zustand';
import { Track } from '@/hooks/useTracksOptimized';

/**
 * Repeat mode options for playback
 * - 'off': No repeat, stop at end of queue
 * - 'all': Repeat entire queue
 * - 'one': Repeat current track
 */
type RepeatMode = 'off' | 'all' | 'one';

/**
 * Player UI display modes
 * - 'minimized': Hidden/minimized state
 * - 'compact': Small player bar at bottom
 * - 'expanded': Medium-sized player overlay
 * - 'fullscreen': Full-screen player view
 */
type PlayerMode = 'compact' | 'expanded' | 'fullscreen' | 'minimized';

/**
 * Player state interface defining all state properties and actions
 */
interface PlayerState {
  // Current playback state
  activeTrack: Track | null;        // Currently playing/selected track
  isPlaying: boolean;                // Playback status (playing/paused)
  
  // Queue management
  queue: Track[];                    // Array of tracks in playback queue
  currentIndex: number;              // Index of current track in queue
  
  // Playback modes
  shuffle: boolean;                  // Shuffle mode enabled/disabled
  repeat: RepeatMode;                // Repeat mode setting
  
  // Audio settings (persisted)
  volume: number;                    // Volume level 0-1
  
  // UI state
  playerMode: PlayerMode;            // Current player display mode
  
  // Playback control actions
  playTrack: (track?: Track) => void;      // Play specific track or resume current
  pauseTrack: () => void;                  // Pause current playback
  closePlayer: () => void;                 // Close player and stop playback
  nextTrack: () => void;                   // Skip to next track
  previousTrack: () => void;               // Go to previous track
  
  // Queue management actions
  addToQueue: (track: Track) => void;                      // Add track to end of queue
  removeFromQueue: (index: number) => void;                // Remove track at index
  clearQueue: () => void;                                  // Clear entire queue
  reorderQueue: (oldIndex: number, newIndex: number) => void;  // Reorder queue items
  
  // Mode toggle actions
  toggleShuffle: () => void;           // Toggle shuffle mode
  toggleRepeat: () => void;            // Cycle through repeat modes
  
  // Volume control
  setVolume: (volume: number) => void; // Set volume level 0-1
  
  // UI mode control actions
  setPlayerMode: (mode: PlayerMode) => void;  // Set specific player mode
  expandPlayer: () => void;                   // Switch to expanded mode
  minimizePlayer: () => void;                 // Switch to compact mode
  maximizePlayer: () => void;                 // Switch to fullscreen mode
}

/**
 * Player business logic - extracted for testability and reusability
 * Contains pure functions for playback control operations
 */
export const playerLogic = {
  /**
   * Play track logic - handles playing specific tracks or resuming playback
   * 
   * @param set - Zustand state setter function
   * @param get - Zustand state getter function
   * @param track - Optional track to play. If omitted, resumes current or plays first in queue
   * 
   * Behavior:
   * - If track provided and is current track: resume playback
   * - If track provided and different: switch to new track (update queue index if in queue)
   * - If no track: resume current track or play first in queue
   */
  playTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState,
    track?: Track
  ) => {
    const { activeTrack, isPlaying, queue, currentIndex } = get();
    
    if (track) {
      // Case 1: Resume the same track if it's paused
      if (activeTrack && activeTrack.id === track.id && !isPlaying) {
        set({ isPlaying: true });
      } 
      // Case 2: Switch to a different track
      else if (activeTrack?.id !== track.id) {
        // Check if track exists in queue to maintain queue continuity
        const trackIndex = queue.findIndex(t => t.id === track.id);
        if (trackIndex !== -1) {
          // Track found in queue - update currentIndex
          set({ activeTrack: track, isPlaying: true, currentIndex: trackIndex });
        } else {
          // Track not in queue - play without updating index (ad-hoc playback)
          set({ activeTrack: track, isPlaying: true });
        }
      }
    } else {
      // No track specified - resume current or play first in queue
      if (activeTrack) {
        // Resume currently selected track
        set({ isPlaying: true });
      } else if (queue.length > 0) {
        // No active track - start with first track in queue
        set({ activeTrack: queue[0], isPlaying: true, currentIndex: 0 });
      }
    }
  },
  
  /**
   * Next track logic - handles skipping to next track with shuffle/repeat support
   * 
   * @param set - Zustand state setter function
   * @param get - Zustand state getter function
   * 
   * Behavior:
   * - Shuffle mode: picks random track from queue
   * - Normal mode: advances to next track in sequence
   * - Repeat all: loops back to start when reaching end
   * - No repeat: stops at end of queue
   */
  nextTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState
  ) => {
    const { queue, currentIndex, repeat, shuffle } = get();
    
    // Early return if queue is empty
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    if (shuffle) {
      // Shuffle mode: select random track from queue
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      // Reached end of queue
      if (repeat === 'all') {
        // Loop back to beginning
        nextIndex = 0;
      } else {
        // End of queue with no repeat - don't play next
        return;
      }
    }
    
    // Update active track and maintain playing state
    set({ 
      activeTrack: queue[nextIndex], 
      currentIndex: nextIndex,
      isPlaying: true 
    });
  },
  
  /**
   * Previous track logic - handles going back to previous track
   * 
   * @param set - Zustand state setter function
   * @param get - Zustand state getter function
   * 
   * Behavior:
   * - Always goes to previous track in queue
   * - Wraps to end of queue if at beginning
   * - Ignores shuffle mode for intuitive user experience
   */
  previousTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState
  ) => {
    const { queue, currentIndex } = get();
    
    // Early return if queue is empty
    if (queue.length === 0) return;
    
    let prevIndex = currentIndex - 1;
    
    // Wrap to end if at beginning
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    // Update active track and maintain playing state
    set({ 
      activeTrack: queue[prevIndex], 
      currentIndex: prevIndex,
      isPlaying: true 
    });
  },
};

/**
 * Player Store - Zustand store implementation
 * 
 * Creates the global player state store with all actions.
 * This is the main hook exported for components to use.
 * 
 * @example
 * ```tsx
 * const { activeTrack, isPlaying, playTrack, nextTrack } = usePlayerStore();
 * ```
 */
export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  activeTrack: null,
  isPlaying: false,
  queue: [],
  currentIndex: 0,
  shuffle: false,
  repeat: 'off',
  volume: 1.0,  // Default volume
  playerMode: 'minimized',
  
  /**
   * Play track action - delegates to playerLogic and auto-opens player UI
   * Automatically opens compact player if currently minimized
   */
  playTrack: (track) => {
    playerLogic.playTrack(set, get, track);
    
    // Auto-open compact player when starting playback
    const { playerMode } = get();
    if (playerMode === 'minimized') {
      set({ playerMode: 'compact' });
    }
  },
  
  /**
   * Pause track action - stops playback without changing track
   */
  pauseTrack: () => set({ isPlaying: false }),
  
  /**
   * Close player action - stops playback and minimizes player UI
   * Clears active track and resets to minimized mode
   */
  closePlayer: () => set({ activeTrack: null, isPlaying: false, playerMode: 'minimized' }),
  
  /**
   * Next track action - delegates to playerLogic
   */
  nextTrack: () => playerLogic.nextTrack(set, get),
  
  /**
   * Previous track action - delegates to playerLogic
   */
  previousTrack: () => playerLogic.previousTrack(set, get),
  
  /**
   * Add to queue action - appends track to end of queue
   * Does not affect current playback
   */
  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },
  
  /**
   * Remove from queue action - removes track at specified index
   * Handles special cases:
   * - Adjusts currentIndex if track before current is removed
   * - Switches to next track if current track is removed
   * - Clamps currentIndex to valid range
   */
  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;
    
    if (index < currentIndex) {
      // Track removed before current - decrement index
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex && newQueue.length > 0) {
      // Current track removed - stay at same index (effectively plays next track)
      if (newCurrentIndex >= newQueue.length) {
        // Index out of bounds - clamp to last track
        newCurrentIndex = newQueue.length - 1;
      }
      // Update active track to new track at same index
      set({ activeTrack: newQueue[newCurrentIndex] });
    }
    
    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },
  
  /**
   * Clear queue action - removes all tracks and stops playback
   * Resets player to initial state
   */
  clearQueue: () => {
    set({ queue: [], currentIndex: 0, activeTrack: null, isPlaying: false });
  },
  
  /**
   * Reorder queue action - moves track from oldIndex to newIndex
   * Updates currentIndex to maintain currently playing track reference
   * 
   * Uses drag-and-drop array manipulation:
   * 1. Remove item from old position
   * 2. Insert at new position
   * 3. Adjust currentIndex based on move direction
   */
  reorderQueue: (oldIndex, newIndex) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(oldIndex, 1);
    newQueue.splice(newIndex, 0, movedItem);
    
    // Recalculate currentIndex to maintain active track reference
    let newCurrentIndex = currentIndex;
    if (oldIndex === currentIndex) {
      // Current track was moved - update to new position
      newCurrentIndex = newIndex;
    } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
      // Track moved from before to after current - decrement
      newCurrentIndex = currentIndex - 1;
    } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
      // Track moved from after to before current - increment
      newCurrentIndex = currentIndex + 1;
    }
    
    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },
  
  /**
   * Toggle shuffle action - switches shuffle mode on/off
   * Note: Does not re-shuffle queue automatically. Use usePlaybackQueue for that logic.
   */
  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },
  
  /**
   * Toggle repeat action - cycles through repeat modes
   * Order: off → all → one → off
   * - off: Stop at end of queue
   * - all: Loop entire queue
   * - one: Repeat current track
   */
  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentModeIndex = modes.indexOf(state.repeat);
      const nextModeIndex = (currentModeIndex + 1) % modes.length;
      return { repeat: modes[nextModeIndex] };
    });
  },
  
  /**
   * Set volume - sets audio volume level
   * @param volume - Volume level 0-1
   */
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  
  // Player UI mode control actions
  
  /**
   * Set player mode - sets specific UI display mode
   * @param mode - Target player mode
   */
  setPlayerMode: (mode) => set({ playerMode: mode }),
  
  /**
   * Expand player - switches to expanded overlay mode
   */
  expandPlayer: () => set({ playerMode: 'expanded' }),
  
  /**
   * Minimize player - switches to compact bottom bar mode
   */
  minimizePlayer: () => set({ playerMode: 'compact' }),
  
  /**
   * Maximize player - switches to fullscreen mode
   */
  maximizePlayer: () => set({ playerMode: 'fullscreen' }),
}));
