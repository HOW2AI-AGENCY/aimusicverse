// Zustand store for AI Lyrics Wizard state management
import { create } from 'zustand';

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
    characterCount: number;
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
  },
  isGenerating: false,
};

export const useLyricsWizardStore = create<LyricsWizardState>((set, get) => ({
  ...INITIAL_STATE,
  
  // Navigation
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
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
  updateSectionContent: (sectionId, content) => set((state) => ({
    writing: {
      ...state.writing,
      sections: state.writing.sections.map(s => 
        s.id === sectionId ? { ...s, content } : s
      ),
    },
  })),
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
  
  // Validation
  validateLyrics: () => {
    const state = get();
    const finalLyrics = state.getFinalLyrics();
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check character count (Suno limit ~3000)
    const charCount = finalLyrics.length;
    if (charCount > 3000) {
      warnings.push(`Текст слишком длинный (${charCount}/3000 символов)`);
    }
    if (charCount < 100) {
      warnings.push('Текст слишком короткий');
    }
    
    // Check for structure tags
    if (!finalLyrics.includes('[')) {
      suggestions.push('Рекомендуется добавить структурные теги [Verse], [Chorus]');
    }
    
    // Check balance
    const sections = state.writing.sections;
    const emptySections = sections.filter(s => !s.content.trim());
    if (emptySections.length > 0) {
      warnings.push(`${emptySections.length} секций без текста`);
    }
    
    set({
      validation: {
        isValid: warnings.length === 0,
        warnings,
        suggestions,
        characterCount: charCount,
      },
    });
  },
  
  // Generation state
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  // Get final formatted lyrics
  getFinalLyrics: () => {
    const state = get();
    const { sections } = state.writing;
    const { vocalTags, instrumentTags, dynamicTags, emotionalCues } = state.enrichment;
    
    let lyrics = '';
    
    // Add global tags at the beginning
    if (vocalTags.length > 0) {
      lyrics += vocalTags.map(t => `[${t}]`).join(' ') + '\n\n';
    }
    
    // Add each section with its tags
    sections.forEach((section, index) => {
      if (section.content.trim()) {
        // Add section header
        lyrics += `[${section.name}]\n`;
        
        // Add dynamic tags if applicable
        if (index === 0 && dynamicTags.includes('Soft Start')) {
          lyrics += '(softly)\n';
        }
        
        // Add content with emotional cues
        let content = section.content;
        emotionalCues.forEach(cue => {
          if (section.tags.includes(cue)) {
            content = `(${cue.toLowerCase()}) ${content}`;
          }
        });
        
        lyrics += content + '\n\n';
        
        // Add instrument breaks between sections
        if (instrumentTags.length > 0 && index < sections.length - 1) {
          const breakTag = instrumentTags.find(t => t.toLowerCase().includes('break') || t.toLowerCase().includes('solo'));
          if (breakTag && Math.random() > 0.7) {
            lyrics += `[${breakTag}]\n\n`;
          }
        }
      }
    });
    
    return lyrics.trim();
  },
  
  // Reset
  reset: () => set(INITIAL_STATE),
}));
