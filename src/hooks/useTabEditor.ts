/**
 * Hook for managing guitar tab editor state
 * Supports editing, selection, undo/redo, and export
 */

import { useState, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface TabNote {
  id: string;
  string: number; // 0-5 (high E to low E)
  fret: number;   // 0-24
  position: number; // Time position (beat-based)
  duration: number; // In beats
  technique?: 'hammer-on' | 'pull-off' | 'slide' | 'bend' | 'vibrato' | 'palm-mute';
}

export interface TabEditorState {
  notes: TabNote[];
  selectedNotes: Set<string>;
  clipboard: TabNote[];
  history: TabNote[][];
  historyIndex: number;
  bpm: number;
  timeSignature: [number, number];
  title: string;
  artist: string;
}

export type TabTool = 'select' | 'draw' | 'erase' | 'hammer-on' | 'slide' | 'bend';

interface UseTabEditorOptions {
  initialNotes?: TabNote[];
  bpm?: number;
  onNotesChange?: (notes: TabNote[]) => void;
}

const MAX_HISTORY = 50;

function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useTabEditor(options: UseTabEditorOptions = {}) {
  const {
    initialNotes = [],
    bpm = 120,
    onNotesChange,
  } = options;

  const haptic = useHapticFeedback();

  const [state, setState] = useState<TabEditorState>({
    notes: initialNotes,
    selectedNotes: new Set(),
    clipboard: [],
    history: [initialNotes],
    historyIndex: 0,
    bpm,
    timeSignature: [4, 4],
    title: '',
    artist: '',
  });

  const [currentTool, setCurrentTool] = useState<TabTool>('draw');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  /**
   * Save state to history
   */
  const saveToHistory = useCallback((notes: TabNote[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([...notes]);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return {
        ...prev,
        notes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
    onNotesChange?.(notes);
  }, [onNotesChange]);

  /**
   * Add a note
   */
  const addNote = useCallback((
    string: number,
    fret: number,
    position: number,
    duration: number = 1
  ) => {
    const note: TabNote = {
      id: generateNoteId(),
      string,
      fret,
      position,
      duration,
    };

    const newNotes = [...state.notes, note];
    saveToHistory(newNotes);
    haptic.tap();

    return note;
  }, [state.notes, saveToHistory, haptic]);

  /**
   * Update a note
   */
  const updateNote = useCallback((id: string, updates: Partial<Omit<TabNote, 'id'>>) => {
    const newNotes = state.notes.map(note =>
      note.id === id ? { ...note, ...updates } : note
    );
    saveToHistory(newNotes);
    haptic.tap();
  }, [state.notes, saveToHistory, haptic]);

  /**
   * Delete a note
   */
  const deleteNote = useCallback((id: string) => {
    const newNotes = state.notes.filter(note => note.id !== id);
    saveToHistory(newNotes);
    setState(prev => ({
      ...prev,
      selectedNotes: new Set([...prev.selectedNotes].filter(nid => nid !== id)),
    }));
    haptic.tap();
  }, [state.notes, saveToHistory, haptic]);

  /**
   * Delete selected notes
   */
  const deleteSelected = useCallback(() => {
    if (state.selectedNotes.size === 0) return;
    
    const newNotes = state.notes.filter(note => !state.selectedNotes.has(note.id));
    saveToHistory(newNotes);
    setState(prev => ({
      ...prev,
      selectedNotes: new Set(),
    }));
    haptic.impact('medium');
  }, [state.notes, state.selectedNotes, saveToHistory, haptic]);

  /**
   * Select/deselect a note
   */
  const toggleNoteSelection = useCallback((id: string, addToSelection = false) => {
    setState(prev => {
      const newSelection = new Set(addToSelection ? prev.selectedNotes : []);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { ...prev, selectedNotes: newSelection };
    });
    haptic.select();
  }, [haptic]);

  /**
   * Select all notes
   */
  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNotes: new Set(prev.notes.map(n => n.id)),
    }));
    haptic.tap();
  }, [haptic]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNotes: new Set(),
    }));
  }, []);

  /**
   * Copy selected notes
   */
  const copySelected = useCallback(() => {
    const selected = state.notes.filter(n => state.selectedNotes.has(n.id));
    if (selected.length === 0) return;

    // Normalize positions relative to first note
    const minPos = Math.min(...selected.map(n => n.position));
    const copied = selected.map(n => ({
      ...n,
      id: generateNoteId(), // New IDs for paste
      position: n.position - minPos,
    }));

    setState(prev => ({ ...prev, clipboard: copied }));
    haptic.success();
  }, [state.notes, state.selectedNotes, haptic]);

  /**
   * Paste notes at position
   */
  const paste = useCallback((position: number = currentPosition) => {
    if (state.clipboard.length === 0) return;

    const pasted = state.clipboard.map(n => ({
      ...n,
      id: generateNoteId(),
      position: n.position + position,
    }));

    const newNotes = [...state.notes, ...pasted];
    saveToHistory(newNotes);
    
    // Select pasted notes
    setState(prev => ({
      ...prev,
      selectedNotes: new Set(pasted.map(n => n.id)),
    }));
    
    haptic.success();
  }, [state.clipboard, state.notes, currentPosition, saveToHistory, haptic]);

  /**
   * Undo
   */
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        notes: [...prev.history[newIndex]],
        historyIndex: newIndex,
        selectedNotes: new Set(),
      };
    });
    haptic.tap();
  }, [haptic]);

  /**
   * Redo
   */
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        notes: [...prev.history[newIndex]],
        historyIndex: newIndex,
        selectedNotes: new Set(),
      };
    });
    haptic.tap();
  }, [haptic]);

  /**
   * Apply technique to selected notes
   */
  const applyTechnique = useCallback((technique: TabNote['technique']) => {
    if (state.selectedNotes.size === 0) return;

    const newNotes = state.notes.map(note =>
      state.selectedNotes.has(note.id)
        ? { ...note, technique }
        : note
    );
    saveToHistory(newNotes);
    haptic.impact('medium');
  }, [state.notes, state.selectedNotes, saveToHistory, haptic]);

  /**
   * Set BPM
   */
  const setBpm = useCallback((newBpm: number) => {
    setState(prev => ({ ...prev, bpm: newBpm }));
  }, []);

  /**
   * Set title/artist
   */
  const setMetadata = useCallback((title: string, artist: string) => {
    setState(prev => ({ ...prev, title, artist }));
  }, []);

  /**
   * Clear all notes
   */
  const clearAll = useCallback(() => {
    saveToHistory([]);
    setState(prev => ({
      ...prev,
      selectedNotes: new Set(),
    }));
    haptic.impact('heavy');
  }, [saveToHistory, haptic]);

  /**
   * Import notes
   */
  const importNotes = useCallback((notes: TabNote[]) => {
    saveToHistory(notes);
  }, [saveToHistory]);

  /**
   * Get notes at position
   */
  const getNotesAtPosition = useCallback((position: number) => {
    return state.notes.filter(n => 
      n.position <= position && n.position + n.duration > position
    );
  }, [state.notes]);

  return {
    // State
    notes: state.notes,
    selectedNotes: state.selectedNotes,
    clipboard: state.clipboard,
    bpm: state.bpm,
    timeSignature: state.timeSignature,
    title: state.title,
    artist: state.artist,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    hasClipboard: state.clipboard.length > 0,

    // Tool state
    currentTool,
    setCurrentTool,
    isPlaying,
    setIsPlaying,
    currentPosition,
    setCurrentPosition,

    // Actions
    addNote,
    updateNote,
    deleteNote,
    deleteSelected,
    toggleNoteSelection,
    selectAll,
    clearSelection,
    copySelected,
    paste,
    undo,
    redo,
    applyTechnique,
    setBpm,
    setMetadata,
    clearAll,
    importNotes,
    getNotesAtPosition,
  };
}
