import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  
  // Actions
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      completed: false,
      skipped: false,

      startOnboarding: () => set({ 
        isActive: true, 
        currentStep: 0,
        completed: false,
        skipped: false 
      }),

      nextStep: () => set((state) => ({ 
        currentStep: state.currentStep + 1 
      })),

      prevStep: () => set((state) => ({ 
        currentStep: Math.max(0, state.currentStep - 1) 
      })),

      goToStep: (step: number) => set({ currentStep: step }),

      skipOnboarding: () => set({ 
        isActive: false, 
        skipped: true,
        completed: false 
      }),

      completeOnboarding: () => set({ 
        isActive: false, 
        completed: true,
        skipped: false 
      }),

      resetOnboarding: () => set({ 
        isActive: false,
        currentStep: 0,
        completed: false,
        skipped: false 
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);

// Hook to check if onboarding should auto-start
export const useShouldShowOnboarding = () => {
  const { completed, skipped } = useOnboarding();
  return !completed && !skipped;
};
