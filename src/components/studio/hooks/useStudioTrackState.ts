/**
 * useStudioTrackState
 * 
 * Determines the current state of a track in the studio:
 * - raw: No stems, original track
 * - simple_stems: Has vocal + instrumental (2 stems)
 * - detailed_stems: Has multiple separated stems (6+)
 * 
 * Also provides helper methods and stem info.
 */

import { useMemo } from 'react';
import { useTrackStems, TrackStem } from '@/hooks/useTrackStems';
import { StudioTrackState } from '../actions/StudioActionsPanel';

interface UseStudioTrackStateResult {
  trackState: StudioTrackState;
  stems: TrackStem[];
  isLoading: boolean;
  
  // Simple stem helpers
  hasVocalStem: boolean;
  hasInstrumentalStem: boolean;
  vocalStem: TrackStem | undefined;
  instrumentalStem: TrackStem | undefined;
  
  // Detailed stem helpers
  drumsStem: TrackStem | undefined;
  bassStem: TrackStem | undefined;
  pianoStem: TrackStem | undefined;
  guitarStem: TrackStem | undefined;
  otherStems: TrackStem[];
  
  // Separation mode
  separationMode: 'none' | 'simple' | 'detailed';
}

export function useStudioTrackState(trackId: string): UseStudioTrackStateResult {
  const { data: stems = [], isLoading } = useTrackStems(trackId);

  return useMemo(() => {
    // Find specific stems
    const vocalStem = stems.find(s => 
      s.stem_type === 'vocal' || s.stem_type === 'vocals'
    );
    const instrumentalStem = stems.find(s => 
      s.stem_type === 'instrumental' || 
      s.stem_type === 'backing' || 
      s.stem_type === 'accompaniment'
    );
    const drumsStem = stems.find(s => s.stem_type === 'drums');
    const bassStem = stems.find(s => s.stem_type === 'bass');
    const pianoStem = stems.find(s => s.stem_type === 'piano');
    const guitarStem = stems.find(s => s.stem_type === 'guitar');
    
    // Other stems not in main categories
    const mainTypes = ['vocal', 'vocals', 'instrumental', 'backing', 'accompaniment', 'drums', 'bass', 'piano', 'guitar'];
    const otherStems = stems.filter(s => !mainTypes.includes(s.stem_type.toLowerCase()));

    // Determine state
    let trackState: StudioTrackState = 'raw';
    let separationMode: 'none' | 'simple' | 'detailed' = 'none';

    if (stems.length === 0) {
      trackState = 'raw';
      separationMode = 'none';
    } else if (stems.length <= 2 && (vocalStem || instrumentalStem)) {
      // Simple separation: just vocal and/or instrumental
      trackState = 'simple_stems';
      separationMode = 'simple';
    } else if (stems.length > 2) {
      // Detailed separation: multiple stems
      trackState = 'detailed_stems';
      separationMode = 'detailed';
    } else {
      // Default to simple if we have stems but not clearly detailed
      trackState = 'simple_stems';
      separationMode = 'simple';
    }

    return {
      trackState,
      stems,
      isLoading,
      
      hasVocalStem: !!vocalStem,
      hasInstrumentalStem: !!instrumentalStem,
      vocalStem,
      instrumentalStem,
      
      drumsStem,
      bassStem,
      pianoStem,
      guitarStem,
      otherStems,
      
      separationMode,
    };
  }, [stems, isLoading]);
}
