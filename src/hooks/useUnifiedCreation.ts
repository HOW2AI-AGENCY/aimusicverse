import { useState, useCallback } from 'react';
import { QuickCreatePreset } from '@/constants/quickCreatePresets';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

type CreationStep = 'preset' | 'customize' | 'generate' | 'results';

interface UnifiedCreationState {
  currentStep: CreationStep;
  selectedPreset: QuickCreatePreset | null;
  generationParams: Record<string, any> | null;
  trackId: string | null;
}

/**
 * Hook for managing the unified 4-step creation flow
 * 
 * Flow:
 * 1. Select Preset (preset)
 * 2. Customize Parameters (customize)
 * 3. Generate Track (generate)
 * 4. View Results (results)
 */
export function useUnifiedCreation() {
  const navigate = useNavigate();
  const [state, setState] = useState<UnifiedCreationState>({
    currentStep: 'preset',
    selectedPreset: null,
    generationParams: null,
    trackId: null,
  });

  const selectPreset = useCallback((preset: QuickCreatePreset) => {
    setState(prev => ({
      ...prev,
      selectedPreset: preset,
      generationParams: {
        style: preset.defaultParams.style,
        mood: preset.defaultParams.mood,
        tempo: preset.defaultParams.tempo,
        instruments: preset.defaultParams.instruments,
        duration: preset.defaultParams.duration,
      },
    }));
    logger.info('Unified Creation: Preset selected', { presetId: preset.id });
  }, []);

  const goToCustomize = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 'customize' }));
    logger.info('Unified Creation: Moving to customize step');
  }, []);

  const goToGeneration = useCallback(() => {
    if (!state.selectedPreset) {
      logger.warn('Unified Creation: No preset selected');
      return;
    }

    setState(prev => ({ ...prev, currentStep: 'generate' }));
    
    // Navigate to generate page with params
    const params = new URLSearchParams({
      preset: state.selectedPreset.id,
      ...(state.generationParams || {}),
    });
    
    navigate(`/generate?${params.toString()}`);
    logger.info('Unified Creation: Navigating to generation');
  }, [state.selectedPreset, state.generationParams, navigate]);

  const goToResults = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      currentStep: 'results',
      trackId,
    }));
    logger.info('Unified Creation: Track generated', { trackId });
  }, []);

  const reset = useCallback(() => {
    setState({
      currentStep: 'preset',
      selectedPreset: null,
      generationParams: null,
      trackId: null,
    });
    logger.info('Unified Creation: Flow reset');
  }, []);

  return {
    ...state,
    selectPreset,
    goToCustomize,
    goToGeneration,
    goToResults,
    reset,
  };
}
