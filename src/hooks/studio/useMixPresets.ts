/**
 * Mix Presets Hook
 * 
 * Provides predefined mix configurations and auto-save functionality
 */

import { useCallback, useEffect } from 'react';
import type { StemEffects, StemConfig, MixPreset } from './types';
import { defaultStemEffects } from './stemEffectsConfig';
import { logger } from '@/lib/logger';

// Re-export types for convenience
export type { MixPreset, StemConfig };

// Predefined presets for common mixing scenarios
export const defaultMixPresets: Record<string, Omit<MixPreset, 'stems'>> = {
  balanced: {
    id: 'balanced',
    name: 'Сбалансированный',
    description: 'Равномерное распределение всех стемов',
    icon: '⚖️',
    masterVolume: 0.85,
  },
  vocalsFirst: {
    id: 'vocalsFirst',
    name: 'Вокал в фокусе',
    description: 'Усиленный вокал, приглушённый бэк',
    icon: '🎤',
    masterVolume: 0.80,
  },
  instrumentalFocus: {
    id: 'instrumentalFocus',
    name: 'Инструментал',
    description: 'Акцент на инструментах, тихий вокал',
    icon: '🎸',
    masterVolume: 0.85,
  },
  bassHeavy: {
    id: 'bassHeavy',
    name: 'Усиленный бас',
    description: 'Мощный бас для клубного звучания',
    icon: '🔊',
    masterVolume: 0.90,
  },
  acousticClean: {
    id: 'acousticClean',
    name: 'Акустика',
    description: 'Чистое акустическое звучание',
    icon: '🎼',
    masterVolume: 0.75,
  },
};

/**
 * Generate preset configuration for specific stems
 */
export function generatePresetForStems(
  presetId: string,
  stems: Array<{ id: string; stem_type: string }>
): MixPreset | null {
  const presetBase = defaultMixPresets[presetId];
  if (!presetBase) return null;

  const stemConfig: Record<string, StemConfig> = {};

  stems.forEach(stem => {
    const stemType = stem.stem_type.toLowerCase();
    let volume = 0.85;
    const effectsConfig: StemEffects = { ...defaultStemEffects };

    switch (presetId) {
      case 'balanced':
        volume = 0.85;
        break;

      case 'vocalsFirst':
        if (stemType.includes('vocal') || stemType.includes('voice')) {
          volume = 0.95;
          // Add slight EQ boost for vocals
          effectsConfig.eq = {
            ...defaultStemEffects.eq,
            highGain: 2, // Brighten vocals
            midGain: 1,
          };
        } else {
          volume = 0.65;
        }
        break;

      case 'instrumentalFocus':
        if (stemType.includes('vocal') || stemType.includes('voice')) {
          volume = 0.40;
        } else if (stemType.includes('drum') || stemType.includes('percussion')) {
          volume = 0.90;
        } else {
          volume = 0.85;
        }
        break;

      case 'bassHeavy':
        if (stemType.includes('bass')) {
          volume = 1.0;
          effectsConfig.eq = {
            ...defaultStemEffects.eq,
            lowGain: 4, // Boost low end
          };
        } else if (stemType.includes('drum') || stemType.includes('kick')) {
          volume = 0.90;
          effectsConfig.eq = {
            ...defaultStemEffects.eq,
            lowGain: 2,
          };
        } else {
          volume = 0.70;
        }
        break;

      case 'acousticClean':
        if (stemType.includes('vocal')) {
          volume = 0.85;
          // Add warmth with reverb
          effectsConfig.reverb = {
            ...defaultStemEffects.reverb,
            enabled: true,
            wetDry: 0.25,
            decay: 2.0,
          };
        } else if (stemType.includes('guitar') || stemType.includes('piano')) {
          volume = 0.80;
        } else {
          volume = 0.60;
        }
        break;
    }

    stemConfig[stem.id] = {
      volume,
      muted: false,
      solo: false,
      effects: effectsConfig,
    };
  });

  return {
    ...presetBase,
    stems: stemConfig,
  };
}

/**
 * Hook for managing mix presets with auto-save
 */
export function useMixPresets(
  trackId: string,
  stems: Array<{ id: string; stem_type: string }>
) {
  const storageKey = `mix-state-${trackId}`;

  // Load saved mix state
  const loadSavedMix = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Failed to load saved mix', { error });
    }
    return null;
  }, [storageKey]);

  // Save mix state
  const saveMix = useCallback((mixState: {
    masterVolume: number;
    stemStates: Record<string, StemConfig>;
    effectsEnabled: boolean;
    timestamp: number;
  }) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mixState));
      logger.info('Mix state saved', { trackId });
    } catch (error) {
      logger.error('Failed to save mix state', { error });
    }
  }, [storageKey, trackId]);

  // Clear saved mix
  const clearSavedMix = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      logger.info('Saved mix cleared', { trackId });
    } catch (error) {
      logger.error('Failed to clear saved mix', { error });
    }
  }, [storageKey, trackId]);

  // Get available presets for current stems
  const getAvailablePresets = useCallback(() => {
    return Object.keys(defaultMixPresets).map(presetId => {
      const preset = generatePresetForStems(presetId, stems);
      return preset;
    }).filter(Boolean) as MixPreset[];
  }, [stems]);

  return {
    loadSavedMix,
    saveMix,
    clearSavedMix,
    getAvailablePresets,
    generatePresetForStems: (presetId: string) => generatePresetForStems(presetId, stems),
  };
}

/**
 * Auto-save mix state hook
 */
export function useAutoSaveMix(
  trackId: string,
  masterVolume: number,
  stemStates: Record<string, StemConfig>,
  effectsEnabled: boolean,
  enabled: boolean = true
) {
  const storageKey = `mix-state-${trackId}`;

  useEffect(() => {
    if (!enabled) return;

    // Debounce auto-save to avoid excessive writes
    const timeoutId = setTimeout(() => {
      try {
        const mixState = {
          masterVolume,
          stemStates,
          effectsEnabled,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(mixState));
      } catch (error) {
        logger.error('Auto-save failed', { error });
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [trackId, masterVolume, stemStates, effectsEnabled, enabled, storageKey]);
}
