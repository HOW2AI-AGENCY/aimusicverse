/**
 * Hook for parsing MIDI files from URL and extracting notes
 * Uses dynamic import of @tonejs/midi to prevent vendor-audio chunk issues
 */
import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

type MidiType = typeof import('@tonejs/midi');

const log = logger.child({ module: 'MidiFileParser' });

export interface ParsedMidiNote {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  noteName: string;
  track: number;
}

interface ParsedMidi {
  notes: ParsedMidiNote[];
  duration: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number } | null;
  trackNames: string[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

export function useMidiFileParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMidi, setParsedMidi] = useState<ParsedMidi | null>(null);

  const parseMidiFromUrl = useCallback(async (midiUrl: string): Promise<ParsedMidi | null> => {
    setIsLoading(true);
    setError(null);

    try {
      log.info('Fetching MIDI file', { midiUrl });

      // Dynamic import to prevent bundling issues
      const { Midi } = await import('@tonejs/midi') as MidiType;
      
      const response = await fetch(midiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MIDI: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      const notes: ParsedMidiNote[] = [];
      const trackNames: string[] = [];

      midi.tracks.forEach((track, trackIndex) => {
        trackNames.push(track.name || `Track ${trackIndex + 1}`);
        
        track.notes.forEach((note) => {
          notes.push({
            pitch: note.midi,
            startTime: note.time,
            endTime: note.time + note.duration,
            duration: note.duration,
            velocity: note.velocity,
            noteName: midiToNoteName(note.midi),
            track: trackIndex,
          });
        });
      });

      // Sort notes by start time
      notes.sort((a, b) => a.startTime - b.startTime);

      // Get tempo
      const bpm = midi.header.tempos[0]?.bpm || 120;

      // Get time signature
      const timeSignature = midi.header.timeSignatures[0]
        ? {
            numerator: midi.header.timeSignatures[0].timeSignature[0],
            denominator: midi.header.timeSignatures[0].timeSignature[1],
          }
        : null;

      const result: ParsedMidi = {
        notes,
        duration: midi.duration,
        bpm,
        timeSignature,
        trackNames,
      };

      setParsedMidi(result);
      log.info('MIDI parsed successfully', { 
        notesCount: notes.length, 
        duration: midi.duration,
        bpm 
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      log.error('Failed to parse MIDI', { error: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedMidi(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    parsedMidi,
    parseMidiFromUrl,
    reset,
  };
}
