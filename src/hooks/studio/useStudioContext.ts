/**
 * useStudioContext
 * 
 * Centralized state management for unified studio interface.
 * Manages selection context: which element is focused (section, stem, or nothing)
 */

import { create } from 'zustand';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { TrackStem } from '@/hooks/useTrackStems';

export type StudioFocusMode = 'idle' | 'section' | 'stem';

export interface StudioContextState {
  // Focus mode
  focusMode: StudioFocusMode;
  
  // Section focus
  focusedSection: DetectedSection | null;
  focusedSectionIndex: number | null;
  
  // Stem focus
  focusedStemId: string | null;
  focusedStem: TrackStem | null;
  
  // Actions
  focusSection: (section: DetectedSection, index: number) => void;
  focusStem: (stem: TrackStem) => void;
  clearFocus: () => void;
  
  // Check if something is focused
  hasFocus: () => boolean;
}

const initialState = {
  focusMode: 'idle' as StudioFocusMode,
  focusedSection: null,
  focusedSectionIndex: null,
  focusedStemId: null,
  focusedStem: null,
};

export const useStudioContext = create<StudioContextState>((set, get) => ({
  ...initialState,
  
  focusSection: (section, index) => set({
    focusMode: 'section',
    focusedSection: section,
    focusedSectionIndex: index,
    focusedStemId: null,
    focusedStem: null,
  }),
  
  focusStem: (stem) => set({
    focusMode: 'stem',
    focusedStemId: stem.id,
    focusedStem: stem,
    focusedSection: null,
    focusedSectionIndex: null,
  }),
  
  clearFocus: () => set(initialState),
  
  hasFocus: () => {
    const state = get();
    return state.focusMode !== 'idle';
  },
}));
