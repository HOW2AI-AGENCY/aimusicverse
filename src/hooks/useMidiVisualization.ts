import { useState, useCallback, useRef, useEffect } from 'react';
import { Midi, Track } from '@tonejs/midi';
import { logger } from '@/lib/logger';

export interface MidiNote {
  id: string;
  pitch: number;      // MIDI note number (0-127)
  name: string;       // 'C4', 'D#5', etc.
  time: number;       // Start time in seconds
  duration: number;   // Duration in seconds
  velocity: number;   // 0-127
  track: number;      // Track index
  selected?: boolean;
}

export interface MidiTrack {
  name: string;
  instrument: string;
  notes: MidiNote[];
  channel: number;
}

interface UseMidiVisualizationReturn {
  notes: MidiNote[];
  tracks: MidiTrack[];
  duration: number;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  isLoading: boolean;
  error: Error | null;
  selectedNotes: Set<string>;
  loadMidi: (url: string) => Promise<void>;
  loadMidiFromBlob: (blob: Blob) => Promise<void>;
  // Selection
  selectNote: (noteId: string, addToSelection?: boolean) => void;
  selectNotesInRange: (startTime: number, endTime: number, startPitch: number, endPitch: number) => void;
  clearSelection: () => void;
  // Editing
  moveNote: (noteId: string, newTime: number, newPitch: number) => void;
  resizeNote: (noteId: string, newDuration: number) => void;
  deleteNote: (noteId: string) => void;
  deleteSelectedNotes: () => void;
  addNote: (note: Omit<MidiNote, 'id'>) => void;
  updateVelocity: (noteId: string, velocity: number) => void;
  // Export
  exportMidi: () => Blob;
  hasChanges: boolean;
}

// Helper to convert MIDI note number to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}

// Helper to generate unique ID
function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useMidiVisualization(): UseMidiVisualizationReturn {
  const [notes, setNotes] = useState<MidiNote[]>([]);
  const [tracks, setTracks] = useState<MidiTrack[]>([]);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  
  const originalMidiRef = useRef<Midi | null>(null);

  const parseMidi = useCallback((midi: Midi) => {
    const allNotes: MidiNote[] = [];
    const parsedTracks: MidiTrack[] = [];

    // Get tempo
    if (midi.header.tempos.length > 0) {
      setTempo(midi.header.tempos[0].bpm);
    }

    // Get time signature
    if (midi.header.timeSignatures.length > 0) {
      const ts = midi.header.timeSignatures[0];
      setTimeSignature({ numerator: ts.timeSignature[0], denominator: ts.timeSignature[1] });
    }

    // Parse tracks
    midi.tracks.forEach((track: Track, trackIndex: number) => {
      const trackNotes: MidiNote[] = [];
      
      track.notes.forEach((note) => {
        const midiNote: MidiNote = {
          id: generateNoteId(),
          pitch: note.midi,
          name: midiToNoteName(note.midi),
          time: note.time,
          duration: note.duration,
          velocity: Math.round(note.velocity * 127),
          track: trackIndex,
        };
        trackNotes.push(midiNote);
        allNotes.push(midiNote);
      });

      if (trackNotes.length > 0) {
        parsedTracks.push({
          name: track.name || `Track ${trackIndex + 1}`,
          instrument: track.instrument.name || 'Unknown',
          notes: trackNotes,
          channel: track.channel || 0,
        });
      }
    });

    // Calculate duration
    const maxTime = allNotes.reduce((max, note) => 
      Math.max(max, note.time + note.duration), 0
    );
    
    setNotes(allNotes);
    setTracks(parsedTracks);
    setDuration(maxTime);
    setSelectedNotes(new Set());
    setHasChanges(false);
    originalMidiRef.current = midi;
  }, []);

  const loadMidi = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch MIDI file');
      
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      parseMidi(midi);
      logger.info('MIDI file loaded', { url, tracks: midi.tracks.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('Failed to load MIDI', error);
    } finally {
      setIsLoading(false);
    }
  }, [parseMidi]);

  const loadMidiFromBlob = useCallback(async (blob: Blob) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      parseMidi(midi);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('Failed to load MIDI from blob', error);
    } finally {
      setIsLoading(false);
    }
  }, [parseMidi]);

  // Selection functions
  const selectNote = useCallback((noteId: string, addToSelection = false) => {
    setSelectedNotes(prev => {
      const next = addToSelection ? new Set(prev) : new Set<string>();
      if (prev.has(noteId) && addToSelection) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

  const selectNotesInRange = useCallback((
    startTime: number, 
    endTime: number, 
    startPitch: number, 
    endPitch: number
  ) => {
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    const minPitch = Math.min(startPitch, endPitch);
    const maxPitch = Math.max(startPitch, endPitch);

    const selected = notes
      .filter(note => 
        note.time >= minTime && 
        note.time + note.duration <= maxTime &&
        note.pitch >= minPitch && 
        note.pitch <= maxPitch
      )
      .map(note => note.id);

    setSelectedNotes(new Set(selected));
  }, [notes]);

  const clearSelection = useCallback(() => {
    setSelectedNotes(new Set());
  }, []);

  // Editing functions
  const moveNote = useCallback((noteId: string, newTime: number, newPitch: number) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, time: Math.max(0, newTime), pitch: Math.max(0, Math.min(127, newPitch)), name: midiToNoteName(newPitch) }
        : note
    ));
    setHasChanges(true);
  }, []);

  const resizeNote = useCallback((noteId: string, newDuration: number) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, duration: Math.max(0.01, newDuration) }
        : note
    ));
    setHasChanges(true);
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    setSelectedNotes(prev => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
    setHasChanges(true);
  }, []);

  const deleteSelectedNotes = useCallback(() => {
    setNotes(prev => prev.filter(note => !selectedNotes.has(note.id)));
    setSelectedNotes(new Set());
    setHasChanges(true);
  }, [selectedNotes]);

  const addNote = useCallback((note: Omit<MidiNote, 'id'>) => {
    const newNote: MidiNote = {
      ...note,
      id: generateNoteId(),
      name: midiToNoteName(note.pitch),
    };
    setNotes(prev => [...prev, newNote]);
    setHasChanges(true);
  }, []);

  const updateVelocity = useCallback((noteId: string, velocity: number) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, velocity: Math.max(0, Math.min(127, velocity)) }
        : note
    ));
    setHasChanges(true);
  }, []);

  // Export function
  const exportMidi = useCallback((): Blob => {
    const midi = new Midi();
    
    // Set tempo
    midi.header.setTempo(tempo);
    
    // Group notes by track
    const notesByTrack = notes.reduce((acc, note) => {
      if (!acc[note.track]) acc[note.track] = [];
      acc[note.track].push(note);
      return acc;
    }, {} as Record<number, MidiNote[]>);

    // Create tracks
    Object.entries(notesByTrack).forEach(([trackIdx, trackNotes]) => {
      const track = midi.addTrack();
      const originalTrack = tracks[parseInt(trackIdx)];
      if (originalTrack) {
        track.name = originalTrack.name;
      }

      trackNotes.forEach(note => {
        track.addNote({
          midi: note.pitch,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity / 127,
        });
      });
    });

    const arrayBuffer = midi.toArray();
    return new Blob([new Uint8Array(arrayBuffer)], { type: 'audio/midi' });
  }, [notes, tracks, tempo]);

  return {
    notes,
    tracks,
    duration,
    tempo,
    timeSignature,
    isLoading,
    error,
    selectedNotes,
    loadMidi,
    loadMidiFromBlob,
    selectNote,
    selectNotesInRange,
    clearSelection,
    moveNote,
    resizeNote,
    deleteNote,
    deleteSelectedNotes,
    addNote,
    updateVelocity,
    exportMidi,
    hasChanges,
  };
}
