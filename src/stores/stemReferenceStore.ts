import { create } from 'zustand';

export interface StemReferenceInput {
  url: string;
  name: string;
  type: string;
  trackId: string;
  trackTitle?: string;
  trackLyrics?: string;
  trackStyle?: string;
}

export interface StemReference extends StemReferenceInput {
  savedAt: number;
}

interface StemReferenceStore {
  stemReference: StemReference | null;
  setStemReference: (reference: StemReferenceInput | null) => void;
  clearStemReference: () => void;
  isValidReference: () => boolean;
}

const EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

export const useStemReferenceStore = create<StemReferenceStore>((set, get) => ({
  stemReference: null,
  
  setStemReference: (reference) => {
    if (reference) {
      set({ 
        stemReference: { 
          ...reference, 
          savedAt: Date.now() 
        } 
      });
    } else {
      set({ stemReference: null });
    }
  },
  
  clearStemReference: () => set({ stemReference: null }),
  
  isValidReference: () => {
    const { stemReference } = get();
    if (!stemReference) return false;
    return Date.now() - stemReference.savedAt < EXPIRY_TIME;
  },
}));
