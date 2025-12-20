/**
 * Hook for parsing MIDI files from URL and extracting notes
 */
import { useState, useCallback } from 'react';
import { Midi } from '@tonejs/midi';
import { logger } from '@/lib/logger';

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
      
      const response = await fetch(midiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MIDI: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      const notes: ParsedMidiNote[] = [];
      const trackNames: string[] = [];

      midi.tracks.forEach((track, trackIndex) => {
        if (track.name) trackNames.push(track.name);
        
        track.notes.forEach((note) => {
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
