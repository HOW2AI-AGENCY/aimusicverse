/**
 * Mix Presets Hook
 * 
 * Saves and restores mix settings (volumes, effects) to localStorage
 */

import { useState, useCallback, useEffect } from 'react';
import { StemEffects, defaultStemEffects } from './studio/useStemAudioEngine';
import { logger } from '@/lib/logger';

interface StemMixSettings {
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: StemEffects;
}

interface MixPreset {
  id: string;
  name: string;
  trackId: string;
  masterVolume: number;
  stems: Record<string, StemMixSettings>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'stem_studio_presets';

function getStoredPresets(): MixPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    logger.error('Failed to load presets', e);
    return [];
  }
}

function savePresets(presets: MixPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    logger.error('Failed to save presets', e);
  }
}

export function useMixPresets(trackId: string) {
  const [presets, setPresets] = useState<MixPreset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<MixPreset | null>(null);

  // Load presets on mount
  useEffect(() => {
    const allPresets = getStoredPresets();
    const trackPresets = allPresets.filter(p => p.trackId === trackId);
    setPresets(trackPresets);
    
    // Auto-load last used preset
    if (trackPresets.length > 0) {
      const sorted = [...trackPresets].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setCurrentPreset(sorted[0]);
    }
  }, [trackId]);

  // Save current mix as preset
  const savePreset = useCallback((
    name: string,
    masterVolume: number,
    stemStates: Record<string, { volume: number; muted: boolean; solo: boolean }>,
    stemEffects: Record<string, { effects: StemEffects } | undefined>
  ): MixPreset => {
    const now = new Date().toISOString();
    
    // Build stems data
    const stems: Record<string, StemMixSettings> = {};
    Object.entries(stemStates).forEach(([stemId, state]) => {
      stems[stemId] = {
        ...state,
        effects: stemEffects[stemId]?.effects || defaultStemEffects,
      };
    });

    const preset: MixPreset = {
      id: `preset_${Date.now()}`,
      name,
      trackId,
      masterVolume,
      stems,
      createdAt: now,
      updatedAt: now,
    };

    // Save to storage
    const allPresets = getStoredPresets();
    const updatedPresets = [...allPresets.filter(p => p.trackId !== trackId || p.name !== name), preset];
    savePresets(updatedPresets);

    // Update local state
    setPresets(updatedPresets.filter(p => p.trackId === trackId));
    setCurrentPreset(preset);

    logger.info('Preset saved', { name, trackId });
    return preset;
  }, [trackId]);

  // Quick save (auto-save to "Last Session")
  const quickSave = useCallback((
    masterVolume: number,
    stemStates: Record<string, { volume: number; muted: boolean; solo: boolean }>,
    stemEffects: Record<string, { effects: StemEffects } | undefined>
  ) => {
    return savePreset('Последняя сессия', masterVolume, stemStates, stemEffects);
  }, [savePreset]);

  // Load preset
  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setCurrentPreset(preset);
      
      // Update last used time
      const allPresets = getStoredPresets();
      const updated = allPresets.map(p => 
        p.id === presetId ? { ...p, updatedAt: new Date().toISOString() } : p
      );
      savePresets(updated);
    }
    return preset;
  }, [presets]);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    const allPresets = getStoredPresets();
    const updated = allPresets.filter(p => p.id !== presetId);
    savePresets(updated);
    
    setPresets(updated.filter(p => p.trackId === trackId));
    if (currentPreset?.id === presetId) {
      setCurrentPreset(null);
    }
  }, [trackId, currentPreset]);

  // Rename preset
  const renamePreset = useCallback((presetId: string, newName: string) => {
    const allPresets = getStoredPresets();
    const updated = allPresets.map(p => 
      p.id === presetId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
    );
    savePresets(updated);
    
    setPresets(updated.filter(p => p.trackId === trackId));
    if (currentPreset?.id === presetId) {
      setCurrentPreset({ ...currentPreset, name: newName });
    }
  }, [trackId, currentPreset]);

  return {
    presets,
    currentPreset,
    savePreset,
    quickSave,
    loadPreset,
    deletePreset,
    renamePreset,
  };
}
