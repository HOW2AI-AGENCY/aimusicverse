import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface AssistantFormState {
  mode: string;
  styles: string[];
  moods: string[];
  styleDescription: string;
  vocalType: 'vocal' | 'instrumental';
  language: string;
  lyrics: string;
  referenceType: 'none' | 'url' | 'upload' | 'track';
  referenceUrl: string;
  referenceFile: string;
}

const INITIAL_STATE: AssistantFormState = {
  mode: '',
  styles: [],
  moods: [],
  styleDescription: '',
  vocalType: 'vocal',
  language: 'English',
  lyrics: '',
  referenceType: 'none',
  referenceUrl: '',
  referenceFile: '',
};

const STORAGE_KEY = 'assistant-form-state';

export function useAssistantForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<AssistantFormState>(() => {
    // Load saved state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...INITIAL_STATE, ...JSON.parse(saved) };
        } catch (error) {
          logger.error('Failed to parse saved form state', error);
        }
      }
    }
    return INITIAL_STATE;
  });

  // Save to localStorage whenever formState changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
      } catch (error) {
        logger.error('Failed to save form state', error);
      }
    }
  }, [formState]);

  const updateField = useCallback((field: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Mode selection
        return !!formState.mode;
      
      case 2: // Style (optional but at least show it)
        return true;
      
      case 3: // Lyrics (optional for vocal, always valid for instrumental)
        return true;
      
      case 4: // Reference (always optional)
        return true;
      
      case 5: // Review (always valid if we got here)
        return true;
      
      default:
        return false;
    }
  }, [formState]);

  const nextStep = useCallback(() => {
    if (currentStep < 5 && isStepValid(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, isStepValid]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    // Only allow going to completed steps or the current step
    if (step <= currentStep || (step === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(step);
    }
  }, [currentStep, isStepValid]);

  const reset = useCallback(() => {
    setFormState(INITIAL_STATE);
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSavedState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    formState,
    currentStep,
    updateField,
    isStepValid,
    nextStep,
    prevStep,
    goToStep,
    reset,
    clearSavedState,
  };
}
