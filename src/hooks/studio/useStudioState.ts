/**
 * useStudioState - Unified state management for studio
 * Optimized with proper memoization and selective updates
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { TrackStem } from '@/hooks/useTrackStems';

interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
}

type StemStates = Record<string, StemState>;

interface UseStudioStateOptions {
  stems: TrackStem[];
  initialMasterVolume?: number;
}

interface UseStudioStateReturn {
  // Stem states
  stemStates: StemStates;
  getStemState: (stemId: string) => StemState;
  
  // Volume controls
  setStemVolume: (stemId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  masterVolume: number;
  
  // Mute/Solo
  toggleMute: (stemId: string) => void;
  toggleSolo: (stemId: string) => void;
  muteAll: () => void;
  unmuteAll: () => void;
  clearSolo: () => void;
  
  // Pan
  setStemPan: (stemId: string, pan: number) => void;
  
  // Computed
  hasSoloStems: boolean;
  mutedStemIds: string[];
  soloStemIds: string[];
  
  // Reset
  resetToDefaults: () => void;
}

const DEFAULT_STEM_STATE: StemState = {
  volume: 1,
  muted: false,
  solo: false,
  pan: 0,
};

export function useStudioState({
  stems,
  initialMasterVolume = 1,
}: UseStudioStateOptions): UseStudioStateReturn {
  const [masterVolume, setMasterVolume] = useState(initialMasterVolume);
  const [stemStates, setStemStates] = useState<StemStates>(() => {
    return stems.reduce((acc, stem) => {
      acc[stem.id] = { ...DEFAULT_STEM_STATE };
      return acc;
    }, {} as StemStates);
  });

  // Ref for stable callback references
  const stemStatesRef = useRef(stemStates);
  stemStatesRef.current = stemStates;

  // Get single stem state with fallback
  const getStemState = useCallback((stemId: string): StemState => {
    return stemStatesRef.current[stemId] || DEFAULT_STEM_STATE;
  }, []);

  // Volume controls
  const setStemVolume = useCallback((stemId: string, volume: number) => {
    setStemStates(prev => {
      const current = prev[stemId];
      if (!current || current.volume === volume) return prev;
      return {
        ...prev,
        [stemId]: { ...current, volume: Math.max(0, Math.min(1, volume)) },
      };
    });
  }, []);

  // Mute/Solo
  const toggleMute = useCallback((stemId: string) => {
    setStemStates(prev => {
      const current = prev[stemId];
      if (!current) return prev;
      return {
        ...prev,
        [stemId]: { ...current, muted: !current.muted },
      };
    });
  }, []);

  const toggleSolo = useCallback((stemId: string) => {
    setStemStates(prev => {
      const current = prev[stemId];
      if (!current) return prev;
      return {
        ...prev,
        [stemId]: { ...current, solo: !current.solo },
      };
    });
  }, []);

  const muteAll = useCallback(() => {
    setStemStates(prev => {
      const updated = { ...prev };
      for (const id of Object.keys(updated)) {
        updated[id] = { ...updated[id], muted: true };
      }
      return updated;
    });
  }, []);

  const unmuteAll = useCallback(() => {
    setStemStates(prev => {
      const updated = { ...prev };
      for (const id of Object.keys(updated)) {
        updated[id] = { ...updated[id], muted: false };
      }
      return updated;
    });
  }, []);

  const clearSolo = useCallback(() => {
    setStemStates(prev => {
      const updated = { ...prev };
      for (const id of Object.keys(updated)) {
        updated[id] = { ...updated[id], solo: false };
      }
      return updated;
    });
  }, []);

  // Pan
  const setStemPan = useCallback((stemId: string, pan: number) => {
    setStemStates(prev => {
      const current = prev[stemId];
      if (!current || current.pan === pan) return prev;
      return {
        ...prev,
        [stemId]: { ...current, pan: Math.max(-1, Math.min(1, pan)) },
      };
    });
  }, []);

  // Reset
  const resetToDefaults = useCallback(() => {
    setMasterVolume(initialMasterVolume);
    setStemStates(prev => {
      const updated = { ...prev };
      for (const id of Object.keys(updated)) {
        updated[id] = { ...DEFAULT_STEM_STATE };
      }
      return updated;
    });
  }, [initialMasterVolume]);

  // Computed values
  const { hasSoloStems, mutedStemIds, soloStemIds } = useMemo(() => {
    const muted: string[] = [];
    const solo: string[] = [];
    
    for (const [id, state] of Object.entries(stemStates)) {
      if (state.muted) muted.push(id);
      if (state.solo) solo.push(id);
    }
    
    return {
      hasSoloStems: solo.length > 0,
      mutedStemIds: muted,
      soloStemIds: solo,
    };
  }, [stemStates]);

  return {
    stemStates,
    getStemState,
    setStemVolume,
    setMasterVolume,
    masterVolume,
    toggleMute,
    toggleSolo,
    muteAll,
    unmuteAll,
    clearSolo,
    setStemPan,
    hasSoloStems,
    mutedStemIds,
    soloStemIds,
    resetToDefaults,
  };
}
