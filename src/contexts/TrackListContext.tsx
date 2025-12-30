/**
 * Track List Context
 * 
 * Provides track list context for "Play From Here" functionality
 * in track action menus without prop drilling.
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { Track } from '@/types/track';

interface TrackListContextValue {
  tracks: Track[];
  getTrackIndex: (trackId: string) => number;
}

const TrackListContext = createContext<TrackListContextValue | null>(null);

interface TrackListProviderProps {
  tracks: Track[];
  children: ReactNode;
}

/**
 * Provider component that wraps a list of tracks
 * to enable "Play From Here" in child track menus
 */
export function TrackListProvider({ tracks, children }: TrackListProviderProps) {
  const value = useMemo(() => ({
    tracks,
    getTrackIndex: (trackId: string) => tracks.findIndex(t => t.id === trackId),
  }), [tracks]);

  return (
    <TrackListContext.Provider value={value}>
      {children}
    </TrackListContext.Provider>
  );
}

/**
 * Hook to access track list context
 * Returns null if not within a TrackListProvider
 */
export function useTrackListContext() {
  return useContext(TrackListContext);
}

/**
 * Hook to get track list and index for a specific track
 * For use in track action menus
 */
export function useTrackInList(trackId: string) {
  const context = useContext(TrackListContext);
  
  if (!context) {
    return { trackList: undefined, trackIndex: undefined };
  }
  
  const trackIndex = context.getTrackIndex(trackId);
  
  return {
    trackList: context.tracks,
    trackIndex: trackIndex >= 0 ? trackIndex : undefined,
  };
}
