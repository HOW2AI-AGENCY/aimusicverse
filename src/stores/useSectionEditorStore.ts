import { create } from 'zustand';
import { DetectedSection } from '@/hooks/useSectionDetection';

export type SectionEditMode = 'none' | 'selecting' | 'editing' | 'comparing';

interface ReplacementResult {
  taskId: string;
  versionId?: string;
  originalAudioUrl: string;
  newAudioUrl?: string;
  newAudioUrlB?: string; // Second variant from Suno API
  section: { start: number; end: number };
  status: 'pending' | 'completed' | 'failed';
}

interface SectionEditorState {
  // Mode
  editMode: SectionEditMode;
  
  // Selected section
  selectedSection: DetectedSection | null;
  selectedSectionIndex: number | null;
  customRange: { start: number; end: number } | null;
  
  // Editing fields
  editedLyrics: string;
  prompt: string;
  tags: string;
  
  // Progress
  activeTaskId: string | null;
  latestCompletion: ReplacementResult | null;
  
  // Actions
  setEditMode: (mode: SectionEditMode) => void;
  selectSection: (section: DetectedSection, index: number) => void;
  setCustomRange: (start: number, end: number) => void;
  setEditedLyrics: (lyrics: string) => void;
  setPrompt: (prompt: string) => void;
  setTags: (tags: string) => void;
  setActiveTask: (taskId: string | null) => void;
  setLatestCompletion: (result: ReplacementResult | null) => void;
  clearSelection: () => void;
  reset: () => void;
}

const initialState = {
  editMode: 'none' as SectionEditMode,
  selectedSection: null,
  selectedSectionIndex: null,
  customRange: null,
  editedLyrics: '',
  prompt: '',
  tags: '',
  activeTaskId: null,
  latestCompletion: null,
};

export const useSectionEditorStore = create<SectionEditorState>((set) => ({
  ...initialState,
  
  setEditMode: (mode) => set({ editMode: mode }),
  
  selectSection: (section, index) => set({
    selectedSection: section,
    selectedSectionIndex: index,
    customRange: { start: section.startTime, end: section.endTime },
    editedLyrics: section.lyrics,
    editMode: 'editing',
  }),
  
  setCustomRange: (start, end) => set((state) => {
    // Keep lyrics when adjusting range (lyrics sync handled by SynchronizedSectionLyrics component)
    return {
      customRange: { start, end },
      selectedSection: null,
      selectedSectionIndex: null,
      editMode: state.editMode === 'none' ? 'selecting' : state.editMode,
    };
  }),
  
  setEditedLyrics: (lyrics) => set({ editedLyrics: lyrics }),
  setPrompt: (prompt) => set({ prompt }),
  setTags: (tags) => set({ tags }),
  setActiveTask: (taskId) => set({ activeTaskId: taskId }),
  setLatestCompletion: (result) => set({ 
    latestCompletion: result,
    editMode: result ? 'comparing' : 'none',
    activeTaskId: result ? null : null, // Clear active task on completion
  }),
  
  clearSelection: () => set({
    selectedSection: null,
    selectedSectionIndex: null,
    customRange: null,
    editedLyrics: '',
    prompt: '',
    editMode: 'none',
  }),
  
  reset: () => set(initialState),
}));
