import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type { MidiNote } from './useMidiVisualization';

// Tone.js types - loaded dynamically to prevent "Cannot access 't' before initialization" error
type ToneType = typeof import('tone');
type PolySynthType = import('tone').PolySynth;

interface UseMidiSynthReturn {
  isReady: boolean;
  isMuted: boolean;
  volume: number;
  playNote: (note: MidiNote | number, duration?: number, velocity?: number) => void;
  playNotes: (notes: MidiNote[]) => void;
  stopAll: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  initialize: () => Promise<void>;
}

// Convert MIDI note number to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}

// Cached Tone module reference
let ToneModule: ToneType | null = null;

export function useMidiSynth(): UseMidiSynthReturn {
  const synthRef = useRef<PolySynthType | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(-12); // dB

  // Initialize synth with dynamic import to prevent circular dependency issues
  const initialize = useCallback(async () => {
    if (synthRef.current) return;

    try {
      // Dynamically import Tone.js only when needed
      if (!ToneModule) {
        ToneModule = await import('tone');
      }
      const Tone = ToneModule;
      
      await Tone.start();
      
      // Create a polyphonic synth with a pleasant sound
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle8',
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.8,
        },
      }).toDestination();

      synth.volume.value = volume;
      synthRef.current = synth;
      setIsReady(true);
      logger.info('MIDI synth initialized');
    } catch (err) {
      logger.error('Failed to initialize MIDI synth', err);
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

  // Play a single note
  const playNote = useCallback(async (
    noteOrMidi: MidiNote | number,
    duration: number = 0.3,
    velocity: number = 0.8
  ) => {
    if (!synthRef.current || isMuted || !ToneModule) return;

    const midi = typeof noteOrMidi === 'number' ? noteOrMidi : noteOrMidi.pitch;
    const noteName = midiToNoteName(midi);
    const actualDuration = typeof noteOrMidi === 'number' ? duration : noteOrMidi.duration;
    const actualVelocity = typeof noteOrMidi === 'number' ? velocity : noteOrMidi.velocity / 127;

    try {
      synthRef.current.triggerAttackRelease(
        noteName,
        Math.min(actualDuration, 2), // Cap at 2 seconds for preview
        ToneModule.now(),
        actualVelocity
      );
    } catch (err) {
      logger.error('Failed to play note', err);
    }
  }, [isMuted]);

  // Play multiple notes (chord or sequence)
  const playNotes = useCallback(async (notes: MidiNote[]) => {
    if (!synthRef.current || isMuted || notes.length === 0 || !ToneModule) return;

    try {
      // Sort by time
      const sortedNotes = [...notes].sort((a, b) => a.time - b.time);
      const startTime = sortedNotes[0].time;
      const now = ToneModule.now();

      sortedNotes.forEach(note => {
        const noteName = midiToNoteName(note.pitch);
        const offset = note.time - startTime;
        
        synthRef.current?.triggerAttackRelease(
          noteName,
          Math.min(note.duration, 2),
          now + offset,
          note.velocity / 127
        );
      });
    } catch (err) {
      logger.error('Failed to play notes', err);
    }
  }, [isMuted]);

  // Stop all notes
  const stopAll = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
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

  return {
    isReady,
    isMuted,
    volume,
    playNote,
    playNotes,
    stopAll,
    setVolume,
    setMuted,
    initialize,
  };
}
