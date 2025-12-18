// Zustand store for AI Lyrics Wizard state management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LYRICS_MAX_LENGTH, LYRICS_MIN_LENGTH } from '@/constants/generationConstants';
import { LyricsFormatter } from '@/lib/lyrics/LyricsFormatter';
import { LyricsValidator } from '@/lib/lyrics/LyricsValidator';

export interface SectionDefinition {
  id: string;
  type: string;
  name: string;
  lines: number;
  description?: string;
}

export interface LyricSection {
  id: string;
  type: string;
  name: string;
  content: string;
  tags: string[];
}

export interface LyricsWizardState {
  // Current step (1-5)
  step: number;
  
  // Step 1: Concept
  concept: {
    theme: string;
    genre: string;
    mood: string[];
    language: 'ru' | 'en';
    referenceArtistId?: string;
    referenceArtistName?: string;
  };
  
  // Step 2: Structure
  structure: {
    templateName: string;
    sections: SectionDefinition[];
    isCustom: boolean;
  };
  
  // Step 3: Writing
  writing: {
    sections: LyricSection[];
    mode: 'ai' | 'collab' | 'manual';
    currentSectionIndex: number;
  };
  
  // Step 4: Enrichment
  enrichment: {
    vocalTags: string[];
    instrumentTags: string[];
    dynamicTags: string[];
    emotionalCues: string[];
  };
  
  // Step 5: Validation
  validation: {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
    characterCount: number; // Without tags - used for actual limit
    characterCountWithTags: number; // Total - shown for reference
  };
  
  // Loading states
  isGenerating: boolean;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Concept actions
  setTheme: (theme: string) => void;
  setGenre: (genre: string) => void;
  setMood: (mood: string[]) => void;
  setLanguage: (language: 'ru' | 'en') => void;
  setReferenceArtist: (id?: string, name?: string) => void;
  
  // Structure actions
  setTemplate: (templateName: string, sections: SectionDefinition[]) => void;
  setCustomStructure: (sections: SectionDefinition[]) => void;
  addSection: (section: SectionDefinition) => void;
  removeSection: (id: string) => void;
  reorderSections: (sections: SectionDefinition[]) => void;
  
  // Writing actions
  setWritingMode: (mode: 'ai' | 'collab' | 'manual') => void;
  setCurrentSection: (index: number) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  updateSectionTags: (sectionId: string, tags: string[]) => void;
  initializeLyricSections: () => void;
  
  // Enrichment actions
  setVocalTags: (tags: string[]) => void;
  setInstrumentTags: (tags: string[]) => void;
  setDynamicTags: (tags: string[]) => void;
  setEmotionalCues: (cues: string[]) => void;
  
  // Validation actions
  validateLyrics: () => void;
  
  // Generation state
  setIsGenerating: (isGenerating: boolean) => void;
  
  // Get final lyrics
  getFinalLyrics: () => string;
  
  // Reset
  reset: () => void;
}

const INITIAL_STATE = {
  step: 1,
  concept: {
    theme: '',
    genre: '',
    mood: [] as string[],
    language: 'ru' as const,
  },
  structure: {
    templateName: '',
    sections: [] as SectionDefinition[],
    isCustom: false,
  },
  writing: {
    sections: [] as LyricSection[],
    mode: 'collab' as const,
    currentSectionIndex: 0,
  },
  enrichment: {
    vocalTags: [] as string[],
    instrumentTags: [] as string[],
    dynamicTags: [] as string[],
    emotionalCues: [] as string[],
  },
  validation: {
    isValid: false,
    warnings: [] as string[],
    suggestions: [] as string[],
    characterCount: 0,
    characterCountWithTags: 0,
  },
  isGenerating: false,
};

// Debounce timer for validation (IMP012)
let validationTimer: NodeJS.Timeout | null = null;
const VALIDATION_DEBOUNCE_MS = 500;

export const useLyricsWizardStore = create<LyricsWizardState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      
      // Navigation
      setStep: (step) => set({ step }),
      nextStep: () => {
        const state = get();
        
        // Validate section content before allowing step transition (IMP010)
        if (state.step === 3) {
          const hasEmptySections = state.writing.sections.some(s => !s.content.trim());
          if (hasEmptySections) {
            // Don't prevent transition but store warning
            set((state) => ({
              validation: {
                ...state.validation,
                warnings: [
                  ...state.validation.warnings,
                  'Некоторые секции пусты. Рекомендуется заполнить все секции перед продолжением.'
                ]
              }
            }));
          }
        }
        
        set((state) => ({ step: Math.min(state.step + 1, 5) }));
      },
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  
  // Concept
  setTheme: (theme) => set((state) => ({ concept: { ...state.concept, theme } })),
  setGenre: (genre) => set((state) => ({ concept: { ...state.concept, genre } })),
  setMood: (mood) => set((state) => ({ concept: { ...state.concept, mood } })),
  setLanguage: (language) => set((state) => ({ concept: { ...state.concept, language } })),
  setReferenceArtist: (id, name) => set((state) => ({ 
    concept: { ...state.concept, referenceArtistId: id, referenceArtistName: name } 
  })),
  
  // Structure
  setTemplate: (templateName, sections) => set((state) => ({ 
    structure: { ...state.structure, templateName, sections, isCustom: false } 
  })),
  setCustomStructure: (sections) => set((state) => ({ 
    structure: { ...state.structure, sections, isCustom: true, templateName: 'custom' } 
  })),
  addSection: (section) => set((state) => ({ 
    structure: { ...state.structure, sections: [...state.structure.sections, section] } 
  })),
  removeSection: (id) => set((state) => ({ 
    structure: { ...state.structure, sections: state.structure.sections.filter(s => s.id !== id) } 
  })),
  reorderSections: (sections) => set((state) => ({ 
    structure: { ...state.structure, sections } 
  })),
  
  // Writing
  setWritingMode: (mode) => set((state) => ({ writing: { ...state.writing, mode } })),
  setCurrentSection: (index) => set((state) => ({ writing: { ...state.writing, currentSectionIndex: index } })),
  updateSectionContent: (sectionId, content) => {
    set((state) => ({
      writing: {
        ...state.writing,
        sections: state.writing.sections.map(s => 
          s.id === sectionId ? { ...s, content } : s
        ),
      },
    }));
    
    // Trigger debounced validation (IMP012)
    if (validationTimer) {
      clearTimeout(validationTimer);
    }
    validationTimer = setTimeout(() => {
      get().validateLyrics();
    }, VALIDATION_DEBOUNCE_MS);
  },
  updateSectionTags: (sectionId, tags) => set((state) => ({
    writing: {
      ...state.writing,
      sections: state.writing.sections.map(s => 
        s.id === sectionId ? { ...s, tags } : s
      ),
    },
  })),
  initializeLyricSections: () => set((state) => ({
    writing: {
      ...state.writing,
      sections: state.structure.sections.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name,
        content: '',
        tags: [],
      })),
    },
  })),
  
  // Enrichment
  setVocalTags: (tags) => set((state) => ({ enrichment: { ...state.enrichment, vocalTags: tags } })),
  setInstrumentTags: (tags) => set((state) => ({ enrichment: { ...state.enrichment, instrumentTags: tags } })),
  setDynamicTags: (tags) => set((state) => ({ enrichment: { ...state.enrichment, dynamicTags: tags } })),
  setEmotionalCues: (cues) => set((state) => ({ enrichment: { ...state.enrichment, emotionalCues: cues } })),
  
  // Validation using centralized utilities (IMP029)
  validateLyrics: () => {
    const state = get();
    const finalLyrics = state.getFinalLyrics();
    const validation = LyricsValidator.validate(finalLyrics, state.writing.sections);
    set({ validation });
  },
  
  // Generation state
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  // Get final formatted lyrics using LyricsFormatter utility (IMP028)
  getFinalLyrics: () => {
    const state = get();
    return LyricsFormatter.formatFinal(
      state.writing.sections,
      state.enrichment
    );
  },
  
  // Reset
  reset: () => {
    // Clear pending validation timer to prevent stale updates
    if (validationTimer) {
      clearTimeout(validationTimer);
      validationTimer = null;
    }
    set(INITIAL_STATE);
  },
    }),
    {
      name: 'lyrics-wizard-storage', // unique name for localStorage key (IMP009)
      // Only persist the core state, not loading flags
      partialize: (state) => ({
        step: state.step,
        concept: state.concept,
        structure: state.structure,
        writing: state.writing,
        enrichment: state.enrichment,
        // Don't persist validation and isGenerating as they should be recalculated
      }),
    }
  )
);
