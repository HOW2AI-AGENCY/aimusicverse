/**
 * Hook for synchronized MIDI playback with audio
 * Plays MIDI notes in real-time as audio plays
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type { MidiNote } from '@/hooks/useMidiVisualization';

// Tone.js types - loaded dynamically to prevent "Cannot access 't' before initialization" error
type ToneType = typeof import('tone');
type PolySynthType = import('tone').PolySynth;

// Cached Tone module reference
let ToneModule: ToneType | null = null;

interface UseMidiSyncOptions {
  notes: MidiNote[];
  currentTime: number;
  isPlaying: boolean;
  enabled?: boolean;
}

interface UseMidiSyncReturn {
  isReady: boolean;
  isSyncEnabled: boolean;
  isMuted: boolean;
  volume: number;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  setSyncEnabled: (enabled: boolean) => void;
  initialize: () => Promise<void>;
  playNotePreview: (note: MidiNote) => void;
  stopAll: () => void;
}

// Convert MIDI note number to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}

export function useMidiSync({
  notes,
  currentTime,
  isPlaying,
  enabled = true,
}: UseMidiSyncOptions): UseMidiSyncReturn {
  const synthRef = useRef<PolySynthType | null>(null);
  const playedNotesRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  
  const [isReady, setIsReady] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(enabled);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(-12); // dB

  // Initialize synth with dynamic Tone.js import
  const initialize = useCallback(async () => {
    if (synthRef.current) return;

    try {
      // Dynamically import Tone.js only when needed
      if (!ToneModule) {
        ToneModule = await import('tone');
      }
      const Tone = ToneModule;
      
      await Tone.start();
      
      // Create a pleasant sounding polyphonic synth
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine4',
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.4,
          release: 0.5,
        },
      }).toDestination();

      synth.volume.value = volume;
      synthRef.current = synth;
      setIsReady(true);
      logger.debug('MIDI sync synth initialized');
    } catch (err) {
      logger.error('Failed to initialize MIDI sync synth', err);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  // Play notes that fall within the current time window
  useEffect(() => {
    if (!isPlaying || !isSyncEnabled || isMuted || !synthRef.current || !ToneModule || notes.length === 0) {
      return;
    }

    // Time window for note triggering (50ms lookahead)
    const windowStart = lastTimeRef.current;
    const windowEnd = currentTime;
    
    // Find notes that should be triggered in this window
    const notesToPlay = notes.filter(note => {
      const noteId = `${note.pitch}_${note.time.toFixed(3)}`;
      
      // Check if note starts within window and hasn't been played yet
      if (note.time >= windowStart && note.time < windowEnd && !playedNotesRef.current.has(noteId)) {
        return true;
      }
      return false;
    });

    const Tone = ToneModule;
    
    // Play the notes
    notesToPlay.forEach(note => {
      const noteId = `${note.pitch}_${note.time.toFixed(3)}`;
      const noteName = midiToNoteName(note.pitch);
      const velocity = note.velocity / 127;
      const duration = Math.min(note.duration, 1.5); // Cap duration
      
      try {
        synthRef.current?.triggerAttackRelease(
          noteName,
          duration,
          Tone.now(),
          velocity
        );
        playedNotesRef.current.add(noteId);
      } catch (err) {
        // Silently ignore errors for individual notes
      }
    });

    lastTimeRef.current = currentTime;
  }, [currentTime, isPlaying, isSyncEnabled, isMuted, notes]);

  // Reset played notes when playback stops or seeks
  useEffect(() => {
    if (!isPlaying) {
      playedNotesRef.current.clear();
      lastTimeRef.current = currentTime;
    }
  }, [isPlaying]);

  // Reset when seeking backwards significantly
  useEffect(() => {
    if (Math.abs(currentTime - lastTimeRef.current) > 0.5) {
      playedNotesRef.current.clear();
      lastTimeRef.current = currentTime;
    }
  }, [currentTime]);

  // Play a single note preview
  const playNotePreview = useCallback((note: MidiNote) => {
    if (!synthRef.current || isMuted || !ToneModule) return;

    const noteName = midiToNoteName(note.pitch);
    const velocity = note.velocity / 127;
    
    try {
      synthRef.current.triggerAttackRelease(
        noteName,
        Math.min(note.duration, 0.5),
        ToneModule.now(),
        velocity
      );
    } catch (err) {
      logger.error('Failed to play note preview', err);
    }
  }, [isMuted]);

  // Stop all notes
  const stopAll = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
    playedNotesRef.current.clear();
  }, []);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (synthRef.current) {
      synthRef.current.volume.value = vol;
    }
  }, []);

  // Set muted
  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (synthRef.current) {
      synthRef.current.volume.value = muted ? -Infinity : volume;
    }
  }, [volume]);

  // Set sync enabled
  const setSyncEnabled = useCallback((enabled: boolean) => {
    setIsSyncEnabled(enabled);
    if (!enabled) {
      stopAll();
    }
  }, [stopAll]);

  return {
    isReady,
    isSyncEnabled,
    isMuted,
    volume,
    setVolume,
    setMuted,
    setSyncEnabled,
    initialize,
    playNotePreview,
    stopAll,
  };
}
