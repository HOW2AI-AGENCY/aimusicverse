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

      // Dynamically import @tonejs/midi to prevent vendor-audio chunk issues
      const midiModule: MidiType = await import('@tonejs/midi');
      const MidiClass = (midiModule as any).Midi ?? midiModule.Midi;

      const response = await fetch(midiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MIDI: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new MidiClass(arrayBuffer);

      const notes: ParsedMidiNote[] = [];
      const trackNames: string[] = [];

      midi.tracks.forEach((track: any, trackIndex: number) => {
        if (track.name) trackNames.push(track.name);

        track.notes.forEach((note: any) => {
          notes.push({
            pitch: note.midi,
            startTime: note.time,
            endTime: note.time + note.duration,
            duration: note.duration,
            velocity: Math.round(note.velocity * 127),
            noteName: midiToNoteName(note.midi),
            track: trackIndex,
          });
        });
      });

      // Sort notes by start time
      notes.sort((a, b) => a.startTime - b.startTime);

      const duration = midi.duration;
      const bpm = midi.header.tempos?.[0]?.bpm ?? 120;
      const timeSig = midi.header.timeSignatures?.[0];
      const timeSignature = timeSig 
        ? { numerator: timeSig.timeSignature[0], denominator: timeSig.timeSignature[1] }
        : null;

      const result: ParsedMidi = {
        notes,
        duration,
        bpm,
        timeSignature,
        trackNames,
      };

      log.info('MIDI parsed successfully', { 
        noteCount: notes.length, 
        duration, 
        bpm,
        tracks: trackNames.length 
      });

      setParsedMidi(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('Failed to parse MIDI', { error: message });
      setError(message);
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
    parseMidiFromUrl,
    parsedMidi,
    isLoading,
    error,
    reset,
  };
}
