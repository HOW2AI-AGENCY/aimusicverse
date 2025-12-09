/**
 * Stem Controls Hook
 * 
 * Manages stem states (mute, solo, volume) and master controls
 */

import { useState, useCallback, useMemo } from 'react';

export interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface UseStemControlsProps {
  stemIds: string[];
  initialVolume?: number;
}

export function useStemControls({ 
  stemIds, 
  initialVolume = 0.85 
}: UseStemControlsProps) {
  const [stemStates, setStemStates] = useState<Record<string, StemState>>(() => {
    const initial: Record<string, StemState> = {};
    stemIds.forEach(id => {
      initial[id] = { muted: false, solo: false, volume: initialVolume };
    });
    return initial;
  });

  const [masterVolume, setMasterVolume] = useState(0.85);
  const [masterMuted, setMasterMuted] = useState(false);

  /**
   * Check if any stem is in solo mode
   */
  const hasSolo = useMemo(() => 
    Object.values(stemStates).some(s => s.solo),
    [stemStates]
  );

  /**
   * Toggle stem mute/solo
   */
  const toggleStem = useCallback((stemId: string, type: 'mute' | 'solo') => {
    setStemStates(prev => {
      const newStates = { ...prev };

      if (type === 'solo') {
        const wasSolo = prev[stemId]?.solo;
        newStates[stemId] = { ...newStates[stemId], solo: !wasSolo };
        
        // Clear solo on other stems when enabling solo
        if (!wasSolo) {
          Object.keys(newStates).forEach(id => {
            if (id !== stemId) {
              newStates[id] = { ...newStates[id], solo: false };
            }
          });
        }
      } else {
        newStates[stemId] = { 
          ...newStates[stemId], 
          muted: !prev[stemId]?.muted 
        };
      }

      return newStates;
    });
  }, []);

  /**
   * Set stem volume
   */
  const setStemVolume = useCallback((stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume }
    }));
  }, []);

  /**
   * Reset all stem states to default
   */
  const resetStems = useCallback(() => {
    setStemStates(prev => {
      const reset: Record<string, StemState> = {};
      Object.keys(prev).forEach(id => {
        reset[id] = { muted: false, solo: false, volume: initialVolume };
      });
      return reset;
    });
    setMasterVolume(0.85);
    setMasterMuted(false);
  }, [initialVolume]);

  /**
   * Get effective volume for a stem (considering mute, solo, master)
   */
  const getEffectiveVolume = useCallback((stemId: string): number => {
    const state = stemStates[stemId];
    if (!state) return 0;

    const isMuted = masterMuted || state.muted || (hasSolo && !state.solo);
    return isMuted ? 0 : state.volume * masterVolume;
  }, [stemStates, masterVolume, masterMuted, hasSolo]);

  /**
   * Get stem mute status (including solo logic)
   */
  const isStemMuted = useCallback((stemId: string): boolean => {
    const state = stemStates[stemId];
    if (!state) return true;
    return masterMuted || state.muted || (hasSolo && !state.solo);
  }, [stemStates, masterMuted, hasSolo]);

  /**
   * Set all stem states at once (for presets)
   */
  const setAllStemStates = useCallback((states: Record<string, StemState>) => {
    setStemStates(states);
  }, []);

  return {
    stemStates,
    masterVolume,
    masterMuted,
    hasSolo,
    toggleStem,
    setStemVolume,
    setMasterVolume,
    setMasterMuted,
    resetStems,
    getEffectiveVolume,
    isStemMuted,
    setAllStemStates,
  };
}
