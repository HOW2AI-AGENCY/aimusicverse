/**
 * useGenerationResult Hook
 * 
 * Manages the state for showing generation results after track creation.
 * Listens for new track creation and opens the result sheet.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface GenerationResultState {
  open: boolean;
  trackId: string | null;
  trackTitle: string | null;
}

export function useGenerationResult() {
  const { user } = useAuth();
  const [state, setState] = useState<GenerationResultState>({
    open: false,
    trackId: null,
    trackTitle: null,
  });
  
  // Track IDs we've already shown results for (to avoid duplicates)
  const shownTrackIds = useRef<Set<string>>(new Set());
  
  // Flag to track if we're expecting a generation result
  const expectingResult = useRef(false);

  // Mark that we're expecting a generation result
  const expectResult = useCallback(() => {
    expectingResult.current = true;
    logger.debug('Generation result expected');
  }, []);

  // Open result sheet for a specific track
  const showResult = useCallback((trackId: string, trackTitle?: string) => {
    if (shownTrackIds.current.has(trackId)) {
      logger.debug('Already showed result for track', { trackId });
      return;
    }
    
    shownTrackIds.current.add(trackId);
    expectingResult.current = false;
    
    setState({
      open: true,
      trackId,
      trackTitle: trackTitle || null,
    });
    
    logger.info('Showing generation result', { trackId, trackTitle });
  }, []);

  // Close result sheet
  const closeResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      open: false,
    }));
  }, []);

  // Clear result completely
  const clearResult = useCallback(() => {
    setState({
      open: false,
      trackId: null,
      trackTitle: null,
    });
  }, []);

  // Listen for new tracks created by the current user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('generation-result-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Only show result if we're expecting one
          if (!expectingResult.current) {
            logger.debug('Track inserted but not expecting result', { trackId: payload.new.id });
            return;
          }
          
          const newTrack = payload.new as { id: string; title: string };
          logger.info('New track detected, showing result', { trackId: newTrack.id });
          
          // Small delay to ensure versions are also created
          setTimeout(() => {
            showResult(newTrack.id, newTrack.title);
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showResult]);

  return {
    // State
    resultOpen: state.open,
    resultTrackId: state.trackId,
    resultTrackTitle: state.trackTitle,
    
    // Actions
    expectResult,
    showResult,
    closeResult,
    clearResult,
    setResultOpen: (open: boolean) => {
      if (open) {
        // Don't allow opening without a track
        return;
      }
      closeResult();
    },
  };
}
