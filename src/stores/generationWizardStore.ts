/**
 * Generation Wizard Store - manages step-by-step music creation wizard state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WizardStep = 'idea' | 'style' | 'vocals' | 'lyrics' | 'settings' | 'preview';

export interface WizardData {
  // Step 1: Idea
  ideaDescription: string;
  suggestedGenres: string[];
  
  // Step 2: Style
  selectedGenre: string;
  selectedMood: string;
  styleTags: string[];
  
  // Step 3: Vocals
  hasVocals: boolean;
  vocalGender: '' | 'm' | 'f';
  vocalStyle: string;
  
  // Step 4: Lyrics
  lyrics: string;
  lyricsLanguage: string;
  
  // Step 5: Settings
  title: string;
  isPublic: boolean;
  model: string;
  
  // AI assistance
  aiSuggestions: string[];
  lastAiPrompt: string;
}

interface GenerationWizardState {
  // Current step
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  
  // Wizard data
  data: WizardData;
  
  // UI state
  isOpen: boolean;
  isAiProcessing: boolean;
  
  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: WizardStep) => void;
  
  updateData: (updates: Partial<WizardData>) => void;
  resetWizard: () => void;
  
  setIsOpen: (open: boolean) => void;
  setAiProcessing: (processing: boolean) => void;
}

const STEPS_ORDER: WizardStep[] = ['idea', 'style', 'vocals', 'lyrics', 'settings', 'preview'];

const INITIAL_DATA: WizardData = {
  ideaDescription: '',
  suggestedGenres: [],
  selectedGenre: '',
  selectedMood: '',
  styleTags: [],
  hasVocals: true,
  vocalGender: '',
  vocalStyle: '',
  lyrics: '',
  lyricsLanguage: 'ru',
  title: '',
  isPublic: true,
  model: 'V4_5ALL',
  aiSuggestions: [],
  lastAiPrompt: '',
};

export const useGenerationWizardStore = create<GenerationWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 'idea',
      completedSteps: [],
      data: { ...INITIAL_DATA },
      isOpen: false,
      isAiProcessing: false,

      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const currentIndex = STEPS_ORDER.indexOf(currentStep);
        
        if (currentIndex < STEPS_ORDER.length - 1) {
          const newCompletedSteps = completedSteps.includes(currentStep)
            ? completedSteps
            : [...completedSteps, currentStep];
            
          set({
            currentStep: STEPS_ORDER[currentIndex + 1],
            completedSteps: newCompletedSteps,
          });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        const currentIndex = STEPS_ORDER.indexOf(currentStep);
        
        if (currentIndex > 0) {
          set({ currentStep: STEPS_ORDER[currentIndex - 1] });
        }
      },
      
      markStepComplete: (step) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }
      },
      
      updateData: (updates) => set((state) => ({
        data: { ...state.data, ...updates },
      })),
      
      resetWizard: () => set({
        currentStep: 'idea',
        completedSteps: [],
        data: { ...INITIAL_DATA },
        isAiProcessing: false,
      }),
      
      setIsOpen: (open) => set({ isOpen: open }),
      setAiProcessing: (processing) => set({ isAiProcessing: processing }),
    }),
    {
      name: 'generation-wizard-storage',
      partialize: (state) => ({
        data: state.data,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

// Selectors
export const useWizardProgress = () => {
  const { currentStep, completedSteps } = useGenerationWizardStore();
  const currentIndex = STEPS_ORDER.indexOf(currentStep);
  const progress = ((completedSteps.length) / STEPS_ORDER.length) * 100;
  
  return {
    currentIndex,
    totalSteps: STEPS_ORDER.length,
    progress,
    isFirstStep: currentIndex === 0,
    isLastStep: currentIndex === STEPS_ORDER.length - 1,
  };
};
