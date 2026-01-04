/**
 * useSimulatedStemLevels - Hook for simulating real-time stem audio levels
 * Creates animated levels based on stem volumes and playing state
 * For true metering, use useStemAudioLevels with actual audio element
 */

import { useState, useEffect, useRef, useMemo } from 'react';

export interface SimulatedLevels {
  stems: Record<string, number>;
  master: { left: number; right: number };
}

interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

export function useSimulatedStemLevels(
  stemStates: Record<string, StemState>,
  masterVolume: number,
  masterMuted: boolean,
  isPlaying: boolean
): SimulatedLevels {
  const [levels, setLevels] = useState<SimulatedLevels>({
    stems: {},
    master: { left: 0, right: 0 },
  });
  
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  
  // Check if any stem is soloed
  const hasSolo = useMemo(() => 
    Object.values(stemStates).some(s => s.solo),
    [stemStates]
  );

  useEffect(() => {
    if (!isPlaying || masterMuted) {
      // Decay levels when not playing
      setLevels(prev => ({
        stems: Object.keys(prev.stems).reduce((acc, key) => {
          acc[key] = prev.stems[key] * 0.85;
          return acc;
        }, {} as Record<string, number>),
        master: {
          left: prev.master.left * 0.85,
          right: prev.master.right * 0.85,
        },
      }));
      return;
    }

    const animate = () => {
      timeRef.current += 0.05;
      const time = timeRef.current;

      const newStemLevels: Record<string, number> = {};
      let totalLevel = 0;
      let activeStems = 0;

      Object.entries(stemStates).forEach(([stemId, state]) => {
        // Check if stem should be audible
        const isAudible = !state.muted && (!hasSolo || state.solo);
        
        if (isAudible) {
          // Generate pseudo-random animated level based on volume
          const baseLevel = (state.volume / 100) * 0.7;
          const variation = Math.sin(time * 3 + parseInt(stemId.slice(-4), 16) * 0.001) * 0.15;
          const noise = Math.random() * 0.15;
          const level = Math.min(1, Math.max(0, baseLevel + variation + noise));
          
          newStemLevels[stemId] = level;
          totalLevel += level;
          activeStems++;
        } else {
          newStemLevels[stemId] = 0;
        }
      });

      // Calculate master levels with slight stereo difference
      const avgLevel = activeStems > 0 ? totalLevel / activeStems : 0;
      const masterFactor = masterVolume / 100;
      const leftVar = Math.sin(time * 2.5) * 0.05;
      const rightVar = Math.sin(time * 2.5 + 0.5) * 0.05;

      setLevels({
        stems: newStemLevels,
        master: {
          left: Math.min(1, avgLevel * masterFactor + leftVar),
          right: Math.min(1, avgLevel * masterFactor + rightVar),
        },
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, masterMuted, stemStates, masterVolume, hasSolo]);

  return levels;
}
