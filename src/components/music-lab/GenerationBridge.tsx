import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QUICK_CREATE_PRESETS, QuickCreatePreset } from '@/constants/quickCreatePresets';
import { logger } from '@/lib/logger';

/**
 * GenerationBridge component handles the seamless transition
 * from preset selection to music generation.
 * 
 * It extracts preset parameters from URL query params and
 * can pre-fill the generation form.
 */
export function GenerationBridge() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const presetId = searchParams.get('preset');
    
    if (presetId) {
      const preset = QUICK_CREATE_PRESETS.find((p: QuickCreatePreset) => p.id === presetId);
      
      if (preset) {
        logger.info('Generation Bridge: Preset loaded', { presetId });
        
        // Preset params are already in URL query string
        // The GenerateForm component will read them
        // This component just logs the transition
      } else {
        logger.warn('Generation Bridge: Preset not found', { presetId });
      }
    }
  }, [searchParams]);

  return null; // This is a bridge component with no UI
}

/**
 * Hook to convert preset to generation parameters
 */
export function usePresetToParams(presetId: string | null): Partial<QuickCreatePreset['defaultParams']> | null {
  if (!presetId) return null;

  const preset = QUICK_CREATE_PRESETS.find((p: QuickCreatePreset) => p.id === presetId);
  if (!preset) return null;

  return {
    style: preset.defaultParams.style,
    mood: preset.defaultParams.mood,
    tempo: preset.defaultParams.tempo,
    instruments: preset.defaultParams.instruments,
    duration: preset.defaultParams.duration,
  };
}
