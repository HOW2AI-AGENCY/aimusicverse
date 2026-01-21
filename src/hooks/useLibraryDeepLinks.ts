/**
 * useLibraryDeepLinks - URL parameter and deep link effects for Library page
 * 
 * Handles opening track details and action dialogs from URL parameters
 * 
 * @module hooks/useLibraryDeepLinks
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Track } from "@/hooks/useTracks";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'useLibraryDeepLinks' });

export type DeepLinkDialogType = 'add_vocals' | 'add_instrumental' | 'extend' | 'cover' | null;

interface UseLibraryDeepLinksOptions {
  tracks: Track[] | undefined;
  onPlayTrack: (track: Track) => void;
}

export function useLibraryDeepLinks({
  tracks,
  onPlayTrack,
}: UseLibraryDeepLinksOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProcessedRef = useRef(false);

  // State for deep link track detail sheet
  const [selectedTrackForDetail, setSelectedTrackForDetail] = useState<Track | null>(null);
  
  // State for deep link action dialogs
  const [deepLinkDialogTrack, setDeepLinkDialogTrack] = useState<Track | null>(null);
  const [deepLinkDialogType, setDeepLinkDialogType] = useState<DeepLinkDialogType>(null);

  // Handle deep link: ?track=UUID&action=xxx - open track detail or specific dialog
  useEffect(() => {
    const trackIdFromUrl = searchParams.get('track');
    const actionFromUrl = searchParams.get('action') as DeepLinkDialogType;
    
    if (trackIdFromUrl && tracks && tracks.length > 0 && !deepLinkProcessedRef.current) {
      const track = tracks.find(t => t.id === trackIdFromUrl);
      
      if (track) {
        deepLinkProcessedRef.current = true;
        log.info('Deep link: opening track', { trackId: trackIdFromUrl, action: actionFromUrl });
        
        // Check if we have a specific action to perform
        if (actionFromUrl && ['add_vocals', 'add_instrumental', 'extend', 'cover'].includes(actionFromUrl)) {
          // Open the specific dialog for the action
          setDeepLinkDialogTrack(track);
          setDeepLinkDialogType(actionFromUrl);
        } else {
          // Open track detail sheet (default behavior)
          setSelectedTrackForDetail(track);
          
          // Auto-play the track
          if (track.audio_url) {
            onPlayTrack(track);
          }
        }
        
        // Clear the query parameter to prevent re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('track');
        newParams.delete('view');
        newParams.delete('action');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, tracks, onPlayTrack, setSearchParams]);

  // Close handlers
  const closeTrackDetail = useCallback(() => {
    setSelectedTrackForDetail(null);
  }, []);

  const closeDeepLinkDialog = useCallback(() => {
    setDeepLinkDialogTrack(null);
    setDeepLinkDialogType(null);
  }, []);

  return {
    selectedTrackForDetail,
    deepLinkDialogTrack,
    deepLinkDialogType,
    closeTrackDetail,
    closeDeepLinkDialog,
  };
}
