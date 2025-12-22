/**
 * useHintTracking - Hook for tracking user hints/tooltips
 * 
 * Ensures tooltips and contextual hints are shown only once per user
 * Stores state in localStorage for persistence across sessions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasSeenHint, markAsSeen } = useHintTracking('swipe-gesture');
 *   
 *   return (
 *     <>
 *       {!hasSeenHint && (
 *         <Tooltip onOpen={markAsSeen}>
 *           <TooltipContent>💡 Swipe for quick actions</TooltipContent>
 *         </Tooltip>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';

const HINT_PREFIX = 'hint_seen_';
const HINTS_RESET_KEY = 'hints_reset_timestamp';

/**
 * Get all hint IDs that have been seen
 */
export function getSeenHints(): string[] {
  const hints: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HINT_PREFIX)) {
      hints.push(key.replace(HINT_PREFIX, ''));
    }
  }
  return hints;
}

/**
 * Reset all hints (show them again)
 * Useful for Settings or onboarding reset
 */
export function resetAllHints(): void {
  const hints = getSeenHints();
  hints.forEach(hintId => {
    localStorage.removeItem(`${HINT_PREFIX}${hintId}`);
  });
  localStorage.setItem(HINTS_RESET_KEY, Date.now().toString());
}

/**
 * Hook for tracking individual hint state
 * 
 * @param hintId - Unique identifier for the hint (e.g., 'swipe-gesture', 'version-badge')
 * @returns Object with hasSeenHint flag and markAsSeen function
 */
export function useHintTracking(hintId: string) {
  const storageKey = `${HINT_PREFIX}${hintId}`;
  
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch (error) {
      console.warn('Failed to read hint state from localStorage:', error);
      return false;
    }
  });

  /**
   * Mark hint as seen and persist to localStorage
   */
  const markAsSeen = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
      setHasSeenHint(true);
    } catch (error) {
      console.warn('Failed to save hint state to localStorage:', error);
    }
  }, [storageKey]);

  /**
   * Reset this specific hint (show it again)
   */
  const resetHint = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSeenHint(false);
    } catch (error) {
      console.warn('Failed to reset hint state:', error);
    }
  }, [storageKey]);

  return {
    /** Whether this hint has been seen before */
    hasSeenHint,
    
    /** Mark this hint as seen */
    markAsSeen,
    
    /** Reset this hint to show it again */
    resetHint,
  };
}

/**
 * Hook for tracking multiple hints at once
 * Useful for components that need to check multiple hints
 * 
 * @param hintIds - Array of hint identifiers
 * @returns Map of hint IDs to their seen status
 */
export function useMultipleHints(hintIds: string[]) {
  const [seenHints, setSeenHints] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    hintIds.forEach(id => {
      try {
        initial[id] = localStorage.getItem(`${HINT_PREFIX}${id}`) === 'true';
      } catch (error) {
        initial[id] = false;
      }
    });
    return initial;
  });

  const markHintAsSeen = useCallback((hintId: string) => {
    try {
      localStorage.setItem(`${HINT_PREFIX}${hintId}`, 'true');
      setSeenHints(prev => ({ ...prev, [hintId]: true }));
    } catch (error) {
      console.warn('Failed to save hint state:', error);
    }
  }, []);

  return {
    seenHints,
    markHintAsSeen,
  };
}

/**
 * Predefined hint IDs for consistency across the app
 */
export const HINT_IDS = {
  // Track interactions
  SWIPE_GESTURE: 'swipe-gesture',
  VERSION_BADGE: 'version-badge',
  WAVEFORM_SEEK: 'waveform-seek',
  TRACK_MENU: 'track-menu',
  
  // Player features
  QUEUE_MANAGEMENT: 'queue-management',
  REPEAT_MODES: 'repeat-modes',
  
  // Studio features
  STEM_MIXING: 'stem-mixing',
  EFFECTS_PANEL: 'effects-panel',
  
  // Generation
  QUICK_PRESETS: 'quick-presets',
  REFERENCE_AUDIO: 'reference-audio',
  
  // Social
  SHARE_OPTIONS: 'share-options',
  PLAYLIST_CREATION: 'playlist-creation',
} as const;
